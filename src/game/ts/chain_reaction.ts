import { array, assert, countingArray } from "./util";

export enum CellType {
	Empty,
	Owned,
}

export interface XY {
	x: number;
	y: number;
}

export interface ChainReactionOptions {
	width: number;
	height: number;
	players: number;
}

type EmptyCell = { type: CellType.Empty };
type OwnedCell = { type: CellType.Owned; owner: number; count: number };
export type Cell = EmptyCell | OwnedCell;

interface Hooks {
	update: Array<() => unknown>;
}

/** Contains common functions for working with `Cell` objects. */
const Cell = {
	/** Mutates a `Cell` into an `EmptyCell`. */
	toEmpty(cell: Cell): EmptyCell {
		const emptyCell = (cell as unknown) as EmptyCell;
		emptyCell.type = CellType.Empty;
		return emptyCell;
	},

	/** Mutates a `Cell` into an `OwnedCell`. */
	toOwned(cell: Cell, owner: number, count: number): OwnedCell {
		const ownedCell = (cell as unknown) as OwnedCell;
		ownedCell.type = CellType.Owned;
		ownedCell.owner = owner;
		ownedCell.count = count;
		return ownedCell;
	},

	/** Creates an `EmptyCell`. */
	empty(): EmptyCell {
		return { type: CellType.Empty };
	},
};

/**
 * Creates a matrix from the provided `cellMatrix`. Each field in the
 * neighbor matrix contains an array of the cells surrounding it. Since
 * getting a cell's neighbors is a common operation in the game, instead
 * of recalculating the neighbors of the same cells every time they're
 * needed, a matrix like this is generated ahead of time.
 *
 * Important Note: To prevent neighbor matrix invalidation, cell
 * references should be preserved. This means that modifying a cell should
 * be done exclusively in a *mutable* fashion.
 */
function neighborMatrix(cellMatrix: Cell[], width: number, height: number) {
	const getXY = (pos: number): XY => ({
		x: pos % width,
		y: Math.floor(pos / width),
	});

	const getPos = ({ x, y }: XY) => y * width + x;

	const neighbors = ({ x, y }: XY): XY[] => [
		{ x: x - 1, y },
		{ x: x + 1, y },
		{ x, y: y - 1 },
		{ x, y: y + 1 },
	];

	const inBounds = ({ x, y }: XY) =>
		x >= 0 && x < width && y >= 0 && y < height;

	const matrix = countingArray(width * height)
		.map(getXY)
		.map(neighbors)
		.map(neighbors => neighbors.filter(inBounds))
		.map(neighbors => neighbors.map(getPos))
		.map(neighbors => neighbors.map(pos => ({ pos, cell: cellMatrix[pos] })));

	return matrix;
}

export class ChainReaction {
	/** Width of the board. */
	readonly width: number;

	/** Height of the board. */
	readonly height: number;

	/** Number of players. */
	readonly players: number;

	/** The game board. */
	grid: Cell[];

	/** The next player to play. */
	private _currentPlayer: number;

	/** Number of players with cells on the game board. */
	private alivePlayers: number;

	/** Holds scores for all players. */
	private playerScore: number[];

	/** Number of moves made so far. */
	private turn: number;

	/** Neighbor matrix. See `neighborMatrix()`. */
	private neighbors: Array<Array<{ pos: number; cell: Cell }>>;

	/** Collection of event handlers. */
	private hooks: Hooks;

	constructor(options: ChainReactionOptions) {
		const { width, height, players } = options;

		this.width = width;
		this.height = height;
		this.players = players;
		this._currentPlayer = 0;
		this.alivePlayers = 0;
		this.turn = 0;
		this.hooks = { update: [] };

		this.grid = array(width * height, Cell.empty);
		this.neighbors = neighborMatrix(this.grid, width, height);
		this.playerScore = array(players, () => 0);
	}

	get currentPlayer(): number {
		return this._currentPlayer;
	}

	/** Converts a 2D position into a 1D position. */
	private getPos(x: number, y: number) {
		return y * this.width + x;
	}

	/** Tells whether the cell at the given position should explode. */
	private shouldExplode(pos: number) {
		const cell = this.grid[pos];
		return cell.type === CellType.Empty
			? true
			: cell.count >= this.neighbors[pos].length;
	}

	/**
	 * Adds an event handler for the given event.
	 *
	 * @returns An unsubscribe function.
	 */
	addHook<K extends keyof Hooks>(
		event: K,
		handler: Hooks[K][number],
	): () => void {
		this.hooks[event].push(handler);

		return () => {
			const index = this.hooks[event].indexOf(handler);
			this.hooks[event].splice(index, 1);
		};
	}

	/** Tells whether the game is finished. */
	isActive(): boolean {
		// Let each player play one turn. After that, the game is finished
		// when only a single player has cells on the board.
		return this.turn <= this.alivePlayers ? true : this.alivePlayers > 1;
	}

	/** Returns the winner if the game is finished. */
	winner(): number {
		if (this.isActive()) {
			throw new Error("Game is still active.");
		}

		return this.playerScore.findIndex(x => x > 0);
	}

	/** Mutates the game object into its original, unaltered state. */
	async reset(): Promise<void> {
		this._currentPlayer = 0;
		this.turn = 0;
		this.alivePlayers = 0;
		this.playerScore = this.playerScore.map(() => 0);
		this.grid.forEach(Cell.toEmpty);
		await this.runHooks("update");
	}

	/** Tells whether a cell can be placed at the given position. */
	canPlace(x: number, y: number): boolean {
		const pos = this.getPos(x, y);
		const cell = this.grid[pos];
		if (!cell) {
			return false;
		}

		if (cell.type === CellType.Owned) {
			return cell.owner === this.currentPlayer;
		}

		return true;
	}

	/** Updates a player's score while also keeping track of whether the
	 *  player in question has any remaining alive cells.
	 */
	private updateScore(player: number, delta: number) {
		const oldScore = this.playerScore[player];
		this.playerScore[player] += delta;
		const newScore = this.playerScore[player];

		assert(newScore >= 0, `Player ${player} cannot have a negative score.`);

		if (!oldScore && newScore) {
			this.alivePlayers += 1;
		}

		if (oldScore && !newScore) {
			this.alivePlayers -= 1;
		}
	}

	/** Attempts to place a cell at the given position. */
	async place(x: number, y: number): Promise<void> {
		const pos = this.getPos(x, y);
		const cell = this.grid[pos];

		if (!this.isActive()) {
			throw new Error("Cannot play once game is over.");
		}

		if (cell === undefined) {
			throw new Error(`Field (${x}, ${y}) is outside of bounds.`);
		}

		if (cell.type === CellType.Empty) {
			Cell.toOwned(cell, this._currentPlayer, 1);
		} else {
			if (cell.owner !== this._currentPlayer) {
				throw new Error(`Field (${x}, ${y}) is already taken.`);
			}

			cell.count += 1;
		}

		assert(cell.type === CellType.Owned);
		this.updateScore(this.currentPlayer, 1);

		await this.runHooks("update");

		if (this.shouldExplode(pos)) {
			Cell.toEmpty(cell);
			await this.explode(pos, this._currentPlayer);
		}

		this._currentPlayer = (this._currentPlayer + 1) % this.players;
		this.turn += 1;
	}

	toString(): string {
		let result = "";

		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				const pos = this.getPos(x, y);
				const cell = this.grid[pos];
				if (cell.type === CellType.Empty) {
					result += "o";
				} else {
					result += cell.count;
				}

				result += " ";
			}
			result += "\n";
		}

		return result;
	}

	/** Runs all event handlers for the given event. */
	private runHooks(name: keyof Hooks) {
		return Promise.all(this.hooks[name].map(fn => fn()));
	}

	/** Given a cell that has reached critical mass, splits
	 *  the cell and takes over the neighboring cells. This
	 *  process then repeats recursively as long as any of
	 *  the neighboring cells also have critical mass.
	 */
	private async explode(origin: number, player: number): Promise<void> {
		let queue = this.neighbors[origin];

		/** Set of cell positions whose cells have reached critical mass.
		 *  It is important that this collection is a set and not an array
		 *  to avoid the following scenario: Imagine a 3x3 game board like this:
		 *  ```
		 *  0 3 0
		 *  3 3 0
		 *  0 0 0
		 *  ```
		 *  The two cells at (0, 1) and (1, 0) explode and each send one mass to
		 *  the cell in the very center of the board. As explosions are processed
		 *  sequentially, the center cell first has 4, then 5 mass. Since the cell
		 *  had reached critical mass already at 4, pushing to an array causes the
		 *  cell to explode twice.
		 *
		 *  Using a set solves the issue by forcing cells to explode only once.
		 */
		const criticals = new Set<number>();

		while (queue.length) {
			const newQueue: typeof queue = [];

			for (const { pos, cell } of queue) {
				if (cell.type === CellType.Owned) {
					if (cell.owner !== player) {
						this.updateScore(player, cell.count);
						this.updateScore(cell.owner, -cell.count);
						cell.owner = player;
					}

					cell.count += 1;
				} else {
					Cell.toOwned(cell, player, 1);
				}

				assert(cell.type === CellType.Owned);

				if (this.shouldExplode(pos) && this.isActive()) {
					criticals.add(pos);
				}
			}

			// The update hook runs before any of the cells are removed,
			// so that the user has a chance to see which cells had critical
			// mass before they exploded.
			await this.runHooks("update");

			for (const pos of criticals) {
				newQueue.push(...this.neighbors[pos]);
				const cell = this.grid[pos];
				assert(cell.type === CellType.Owned);

				// Make the cell an empty one only if it has no leftover mass.
				cell.count -= this.neighbors[pos].length;
				if (cell.count === 0) {
					Cell.toEmpty(cell);
				}
			}

			queue = newQueue;
			criticals.clear();
		}
	}
}