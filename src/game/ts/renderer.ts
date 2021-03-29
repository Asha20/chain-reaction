import { ChainReaction, CellType, OwnedCell } from "./chain_reaction";
import { assert, debounce } from "@common/util";
import { XY } from "./common";

type PlayerRenderShape = "circle" | "diamond" | "square" | "star";

export interface PlayerRenderOptions {
	cellColor: string;
	textColor: string;
	shape: PlayerRenderShape;
}

export interface MountOptions {
	players: PlayerRenderOptions[];
}

function validateOptions(game: ChainReaction, options: MountOptions) {
	assert(
		options.players.length >= game.players,
		`Game has ${game.players} players, but I only know how to render ${options.players.length}.`,
	);
}

function getContext(canvas: HTMLCanvasElement) {
	const ctx = canvas.getContext("2d");
	assert(ctx, "Could not get canvas context.");
	return ctx;
}

const defaultCanvasSize = new WeakMap<HTMLCanvasElement, number>();

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
		const pixelRatio = window.devicePixelRatio;

		// The canvas element should have width: 100% set with CSS.
		// This then allows us to obtain the maximum width of the canvas
		// without it overflowing out of the document. When the canvas
		//  gets mounted the first time, we remember this value
		//  and use it as a maximum width for further calculations.
		if (!defaultCanvasSize.has(canvas)) {
			const rect = canvas.getBoundingClientRect();
			const maxWidth = rect.width;
			defaultCanvasSize.set(canvas, maxWidth);
			canvas.style.maxHeight = canvas.style.maxWidth = `${maxWidth}px`;
		}

		const maxWidth = defaultCanvasSize.get(canvas);
		assert(maxWidth !== undefined);

		tileSize.update(maxWidth);
		canvas.width = pixelRatio * tileSize.value * game.width;
		canvas.height = pixelRatio * tileSize.value * game.height;

		canvas.style.width = `${canvas.width / pixelRatio}px`;
		canvas.style.height = `${canvas.height / pixelRatio}px`;

		const vMargin = (maxWidth - canvas.height / pixelRatio) / 2;
		canvas.style.marginBottom = canvas.style.marginTop = `${vMargin}px`;

		ctx.textAlign = "center";

		// While it does say here that the unit is pixel, when drawing the
		// board the context gets scaled by the tile size, so effectively
		// this means that the text is 0.25 times the tile size.
		ctx.font = `0.25px sans-serif`;
		draw();
	}

	const tileSize = {
		value: 0,

		update(maxWidth: number) {
			this.value = Math.floor(maxWidth / Math.max(game.width, game.height));
		},
	};

	const tile = (x: number) => x * window.devicePixelRatio * tileSize.value;

	resizeCanvas();

	const onResize = debounce(50, resizeCanvas);
	window.addEventListener("resize", onResize);

	const unsubscribeFromUpdate = game.hooks.add("update", draw);
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

	function drawCell(cx: number, cy: number, cell: OwnedCell, pos: number) {
		const { cellColor, textColor, shape } = options.players[cell.owner];

		ctx.save();

		ctx.fillStyle = cellColor;
		ctx.beginPath();
		ctx.translate(cx, cy);

		if (game.shouldExplode(pos)) {
			ctx.scale(1.25, 1.25);
		}

		ctx.save();
		switch (shape) {
			case "circle":
				ctx.arc(0, 0, 0.25, 0, 2 * Math.PI);
				break;

			case "diamond":
				ctx.rotate(Math.PI / 4);
				ctx.rect(-0.2, -0.2, 0.4, 0.4);
				break;

			case "square":
				ctx.rect(-0.2, -0.2, 0.4, 0.4);
				break;

			case "star":
				ctx.rect(-0.2, -0.2, 0.4, 0.4);
				ctx.rotate(Math.PI / 4);
				ctx.rect(-0.2, -0.2, 0.4, 0.4);
				break;
		}

		ctx.fill();
		ctx.restore();

		ctx.fillStyle = textColor;

		/** Don't bother rendering text if it's too small to read. */
		const MIN_TILE_SIZE_FOR_TEXT = 30;
		if (tileSize.value > MIN_TILE_SIZE_FOR_TEXT) {
			/**
			 * Simply setting the textBaseline to "middle" displays as expected
			 * on Chrome, but looks off on Firefox. As a workaround, offset the
			 * text manually.
			 */
			const TEXT_BASELINE_MIDDLE_OFSET = 0.075;
			ctx.fillText(String(cell.count), 0, TEXT_BASELINE_MIDDLE_OFSET);
		}

		ctx.restore();
	}

	function drawBoard() {
		ctx.scale(tile(1), tile(1));
		const getXY = (pos: number): XY => ({
			x: pos % game.width,
			y: Math.floor(pos / game.width),
		});

		for (let pos = 0; pos < game.grid.length; pos++) {
			const { x, y } = getXY(pos);
			const cell = game.grid[pos];

			if (cell.type === CellType.Owned) {
				drawCell(x + 0.5, y + 0.5, cell, pos);
			}
		}
		ctx.setTransform(1, 0, 0, 1, 0, 0);
	}

	function draw() {
		drawGridLines();
		drawBoard();
	}

	return unsubscribe;
}
