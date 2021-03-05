import { array, assert, countingArray } from "./util";

enum CellType {
	Empty,
	Owned,
}

type EmptyCell = { type: CellType.Empty };
type OwnedCell = { type: CellType.Owned; owner: number; count: number };
type Cell = EmptyCell | OwnedCell;

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
	type XY = { x: number; y: number };

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
	private width: number;
	private height: number;
	private players: number;
	private playerScore: number[];
	private currentPlayer: number;
	private turn: number;
	private grid: Cell[];
	private neighbors: Array<Array<{ pos: number; cell: Cell }>>;

	constructor(width: number, height: number, players: number) {
		this.width = width;
		this.height = height;
		this.players = players;
		this.currentPlayer = 0;
		this.turn = 0;

		this.grid = array(width * height, Cell.empty);
		this.neighbors = neighborMatrix(this.grid, width, height);
		this.playerScore = array(players, () => 0);
	}

	private getPos(x: number, y: number) {
		return y * this.width + x;
	}

	private shouldExplode(pos: number) {
		const cell = this.grid[pos];
		return cell.type === CellType.Empty
			? true
			: cell.count >= this.neighbors[pos].length;
	}

	isActive(): boolean {
		const alivePlayerCount = this.playerScore.filter(x => x > 0).length;

		// Let each player play one turn. After that, the game is finished
		// when only a single player has cells on the board.
		return this.turn <= alivePlayerCount ? true : alivePlayerCount > 1;
	}

	winner(): number {
		if (this.isActive()) {
			throw new Error("Game is still active.");
		}

		return this.playerScore.findIndex(x => x > 0);
	}

	place(x: number, y: number): void {
		const pos = this.getPos(x, y);
		const cell = this.grid[pos];

		if (!this.isActive()) {
			throw new Error("Cannot play once game is over.");
		}

		if (cell === undefined) {
			throw new Error(`Field (${x}, ${y}) is outside of bounds.`);
		}

		if (cell.type === CellType.Empty) {
			Cell.toOwned(cell, this.currentPlayer, 1);
		} else {
			if (cell.owner !== this.currentPlayer) {
				throw new Error(`Field (${x}, ${y}) is already taken.`);
			}

			cell.count += 1;
		}

		assert(cell.type === CellType.Owned);

		this.playerScore[this.currentPlayer] += 1;

		if (this.shouldExplode(pos)) {
			Cell.toEmpty(cell);
			this.explode(pos, this.currentPlayer);
		}

		this.currentPlayer = (this.currentPlayer + 1) % this.players;
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

	private explode(origin: number, player: number): void {
		let queue = this.neighbors[origin];

		while (queue.length) {
			const newQueue: typeof queue = [];

			for (const { pos, cell } of queue) {
				if (cell.type === CellType.Owned) {
					if (cell.owner !== player) {
						this.playerScore[player] += cell.count;
						this.playerScore[cell.owner] -= cell.count;
					}

					cell.owner = player;
					cell.count += 1;
				} else {
					Cell.toOwned(cell, player, 1);
				}

				assert(cell.type === CellType.Owned);

				if (this.shouldExplode(pos) && this.isActive()) {
					Cell.toEmpty(cell);
					newQueue.push(...this.neighbors[pos]);
				}
			}

			queue = newQueue;
		}
	}
}
