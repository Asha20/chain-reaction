import { ChainReaction, CellType, XY } from "./chain_reaction";
import { assert, debounce } from "./util";

export interface MountOptions {
	colors: string[];
}

function validateOptions(game: ChainReaction, options: MountOptions) {
	assert(
		options.colors.length >= game.players,
		"Not enough colors provided for all players.",
	);
}

function getContext(canvas: HTMLCanvasElement) {
	const ctx = canvas.getContext("2d");
	assert(ctx, "Could not get canvas context.");
	return ctx;
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
	validateOptions(game, options);
	const ctx = getContext(canvas);

	function resizeCanvas() {
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width;
		canvas.height = rect.height;
		tileSize = Math.floor(canvas.width / Math.max(game.width, game.height));
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.font = `${tile(0.25)}px sans-serif`;
	}

	let tileSize = Math.floor(canvas.width / Math.max(game.width, game.height));
	const tile = (x: number) => x * tileSize;

	resizeCanvas();

	const onResize = debounce(50, resizeCanvas);
	window.addEventListener("resize", onResize);

	draw();
	const unsubscribeFromUpdate = game.addHook("update", draw);
	const unsubscribeFromResize = () => {
		window.removeEventListener("resize", onResize);
	};

	const unsubscribe = () => {
		unsubscribeFromUpdate();
		unsubscribeFromResize();
	};

	function drawGridLines() {
		// Makes the lines look smoother
		ctx.translate(0.5, 0.5);

		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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
		ctx.translate(-0.5, -0.5);
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

	return unsubscribe;
}
