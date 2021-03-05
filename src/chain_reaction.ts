enum CellType {
	Empty,
	Owned,
}

type EmptyCell = { type: CellType.Empty };
type OwnedCell = { type: CellType.Owned; owner: number; count: number };
type Cell = EmptyCell | OwnedCell;

function array<T>(length: number, fn: (_index: number) => T) {
	return Array.from({ length }, (_, i) => fn(i));
}

function countingArray(length: number) {
	return Array.from({ length }, (_, i) => i);
}

function assert(condition: unknown, message?: string): asserts condition {
	if (!condition) {
		throw new Error(message ?? "Assertion failed.");
	}
}

const Cell = {
	toEmpty(cell: Cell): EmptyCell {
		const emptyCell = (cell as unknown) as EmptyCell;
		emptyCell.type = CellType.Empty;
		return emptyCell;
	},

	toOwned(cell: Cell, owner: number, count: number): OwnedCell {
		const ownedCell = (cell as unknown) as OwnedCell;
		ownedCell.type = CellType.Owned;
		ownedCell.owner = owner;
		ownedCell.count = count;
		return ownedCell;
	},

	empty(): EmptyCell {
		return { type: CellType.Empty };
	},
};

function capacityMatrix(width: number, height: number) {
	const MAX_CAPACITY = 4;
	const matrix = array(width * height, () => MAX_CAPACITY);
	const getPos = (x: number, y: number) => y * width + x;

	const topRow = countingArray(width).map(x => getPos(x, 0));
	const bottomRow = countingArray(width).map(x => getPos(x, height - 1));
	const leftColumn = countingArray(height).map(y => getPos(0, y));
	const rightColumn = countingArray(height).map(y => getPos(width - 1, y));

	const positions = [...topRow, ...bottomRow, ...leftColumn, ...rightColumn];

	for (const pos of positions) {
		matrix[pos] -= 1;
	}

	return matrix;
}

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
	private currentPlayer: number;
	private grid: Cell[];
	private capacity: number[];
	private neighbors: Array<Array<{ pos: number; cell: Cell }>>;

	constructor(width: number, height: number, players: number) {
		this.width = width;
		this.height = height;
		this.players = players;
		this.currentPlayer = 0;

		this.grid = array(width * height, Cell.empty);
		this.capacity = capacityMatrix(width, height);
		this.neighbors = neighborMatrix(this.grid, width, height);
	}

	private getPos(x: number, y: number) {
		return y * this.width + x;
	}

	place(x: number, y: number): void {
		const pos = this.getPos(x, y);
		const cell = this.grid[pos];

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

		if (cell.count >= this.capacity[pos]) {
			Cell.toEmpty(cell);
			this.explode(pos, this.currentPlayer);
		}
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
					cell.owner = player;
					cell.count += 1;
				} else {
					Cell.toOwned(cell, player, 1);
				}

				assert(cell.type === CellType.Owned);

				if (cell.count >= this.capacity[pos]) {
					Cell.toEmpty(cell);
					newQueue.push(...this.neighbors[pos]);
				}
			}

			queue = newQueue;
		}
	}
}
