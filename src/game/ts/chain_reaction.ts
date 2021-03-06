import { assert, array, CancelPromise } from "@common/util";
import { Hooks } from "@common/hooks";
import { countingArray, neighbors } from "./common";

export enum CellType {
	Empty,
	Owned,
}

export interface ChainReactionOptions {
	width: number;
	height: number;
	players: number;
}

type EmptyCell = { type: CellType.Empty };
export type OwnedCell = { type: CellType.Owned; owner: number; count: number };
export type Cell = EmptyCell | OwnedCell;

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
	return countingArray(width * height)
		.map(pos => neighbors(pos, width, height))
		.map(ns => ns.map(pos => ({ pos, cell: cellMatrix[pos] })));
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

	/** Set of positions that have empty cells. */
	emptyCells: Set<number>;

	/** Contains sets of owned positions for each player. */
	ownedCells: Set<number>[];

	latestMove: number | null = null;

	/** The next player to play. */
	private _currentPlayer = 0;

	/** Number of players with cells on the game board. */
	private alivePlayers = 0;

	/** Holds scores for all players. */
	private playerScore: number[];

	/** Number of moves made so far. */
	private turn = 0;

	/** Neighbor matrix. See `neighborMatrix()`. */
	private neighbors: Array<Array<{ pos: number; cell: Cell }>>;

	/** Collection of event handlers. */
	hooks = Hooks("explosionDelay", "update");

	private cancelPromise = CancelPromise();

	constructor(options: ChainReactionOptions) {
		const { width, height, players } = options;

		this.width = width;
		this.height = height;
		this.players = players;

		this.grid = array(width * height, Cell.empty);
		this.neighbors = neighborMatrix(this.grid, width, height);
		this.playerScore = array(players, () => 0);
		this.emptyCells = new Set(countingArray(width * height));
		this.ownedCells = array(players, () => new Set());
	}

	get currentPlayer(): number {
		return this._currentPlayer;
	}

	/** Converts a 2D position into a 1D position. */
	private getPos(x: number, y: number) {
		return y * this.width + x;
	}

	/** Tells whether the cell at the given position should explode. */
	shouldExplode(pos: number): boolean {
		const cell = this.grid[pos];
		return cell.type === CellType.Empty
			? true
			: cell.count >= this.neighbors[pos].length;
	}

	playerIsAlive(player: number): boolean {
		return this.turn < this.players || this.playerScore[player] > 0;
	}

	cancel(): void {
		this.cancelPromise.cancel();
		this.hooks.clear();
	}

	/** The number of cells around the given cell. */
	capacity(pos: number): number {
		return this.neighbors[pos].length;
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
		this.latestMove = null;
		this.playerScore = this.playerScore.map(() => 0);
		this.grid.forEach(Cell.toEmpty);
		this.emptyCells.clear();
		countingArray(this.width * this.height).forEach(x =>
			this.emptyCells.add(x),
		);
		this.ownedCells.forEach(set => set.clear());
		await this.hooks.run("update", this.cancelPromise.promise);
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
		if (this.cancelPromise.cancelled) {
			await this.reset();
			return;
		}

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
			this.ownedCells[this._currentPlayer].add(pos);
			this.emptyCells.delete(pos);
		} else {
			if (cell.owner !== this._currentPlayer) {
				throw new Error(`Field (${x}, ${y}) is already taken.`);
			}

			cell.count += 1;
		}

		assert(cell.type === CellType.Owned);
		this.updateScore(this.currentPlayer, 1);
		this.latestMove = pos;

		await this.hooks.run("update", this.cancelPromise.promise);

		if (this.shouldExplode(pos)) {
			Cell.toEmpty(cell);
			this.emptyCells.add(pos);
			this.ownedCells[this._currentPlayer].delete(pos);
			this.latestMove = null;
			await this.hooks.run("explosionDelay", this.cancelPromise.promise);
			await this.explode(pos, this._currentPlayer);
		}

		this.nextPlayer();
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

	nextPlayer(): void {
		this._currentPlayer = (this._currentPlayer + 1) % this.players;
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
				this.ownedCells[player].add(pos);

				if (cell.type === CellType.Owned) {
					if (cell.owner !== player) {
						this.ownedCells[cell.owner].delete(pos);
						this.updateScore(player, cell.count);
						this.updateScore(cell.owner, -cell.count);
						cell.owner = player;
					}

					cell.count += 1;
				} else {
					Cell.toOwned(cell, player, 1);
					this.emptyCells.delete(pos);
				}

				assert(cell.type === CellType.Owned);

				if (this.shouldExplode(pos) && this.isActive()) {
					criticals.add(pos);
				}
			}

			// The update hook runs before any of the cells are removed,
			// so that the user has a chance to see which cells had critical
			// mass before they exploded.
			await this.hooks.run("update", this.cancelPromise.promise);
			await this.hooks.run("explosionDelay", this.cancelPromise.promise);

			for (const pos of criticals) {
				newQueue.push(...this.neighbors[pos]);
				const cell = this.grid[pos];
				assert(cell.type === CellType.Owned);

				// Make the cell an empty one only if it has no leftover mass.
				cell.count -= this.neighbors[pos].length;
				if (cell.count === 0) {
					this.ownedCells[cell.owner].delete(pos);
					this.emptyCells.add(pos);
					Cell.toEmpty(cell);
				}
			}

			queue = newQueue;
			criticals.clear();

			if (this.cancelPromise.cancelled) {
				await this.reset();
				break;
			}
		}
	}
}
