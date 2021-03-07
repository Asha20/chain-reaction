import { ChainReaction, CellType, XY } from "./chain_reaction";

export interface MountOptions {
	colors: string[];
	tileSize: number;
}

/** Renders the game to a canvas.
 *
 * @returns An unsubscribe function.
 */
export function mount(
	game: ChainReaction,
	canvas: HTMLCanvasElement,
	options: MountOptions,
): () => void {
	const tile = (x: number) => x * options.tileSize;
	canvas.width = tile(game.width);
	canvas.height = tile(game.height);

	if (options.colors.length < game.players) {
		throw new Error("Not enough colors provided for all players.");
	}

	const ctxOrNull = canvas.getContext("2d");
	if (!ctxOrNull) {
		throw new Error("Could not get canvas context.");
	}
	const ctx = ctxOrNull;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.font = `${tile(0.25)}px sans-serif`;

	draw();
	const unsubscribeFromUpdate = game.addHook("update", draw);

	function drawGridLines() {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		for (let x = 1; x < game.width; x++) {
			ctx.beginPath();
			ctx.moveTo(tile(x), 0);
			ctx.lineTo(tile(x), tile(game.height));
			ctx.stroke();
		}

		for (let y = 1; y < game.height; y++) {
			ctx.beginPath();
			ctx.moveTo(0, tile(y));
			ctx.lineTo(tile(game.width), tile(y));
			ctx.stroke();
		}
	}

	function drawBoard() {
		const getXY = (pos: number): XY => ({
			x: pos % game.width,
			y: Math.floor(pos / game.width),
		});

		for (let pos = 0; pos < game.grid.length; pos++) {
			const { x, y } = getXY(pos);
			const cell = game.grid[pos];

			if (cell.type === CellType.Owned) {
				ctx.fillStyle = options.colors[cell.owner];

				ctx.beginPath();
				ctx.arc(tile(x + 0.5), tile(y + 0.5), tile(0.25), 0, 2 * Math.PI);
				ctx.fill();
				ctx.fillStyle = "white";
				ctx.fillText(String(cell.count), tile(x + 0.5), tile(y + 0.5));
			}
		}
	}

	function draw() {
		drawGridLines();
		drawBoard();
	}

	return unsubscribeFromUpdate;
}
