import { assert } from "@common/util";
import { CellType, ChainReaction, OwnedCell } from "@game";
import { XY } from "@game/common";
import { toXY } from "@game/players/common";

type Ctx = CanvasRenderingContext2D;
type Tile = (x: number) => number;

export interface TileSize {
	value: number;
	update(maxWidth: number): void;
}

const shapes = ["circle", "star", "square", "diamond"] as const;
const colors = [
	"red",
	"blue",
	"green",
	"purple",
	"chocolate",
	"darkblue",
	"dimgrey",
	"mediumpurple",
] as const;

export type PlayerRenderShape = typeof shapes[number];

export interface PlayerRenderOptions {
	cellColor: string;
	textColor: string;
	shape: PlayerRenderShape;
}

export const players = (() => {
	const result: PlayerRenderOptions[] = [];

	for (let i = 0; i < colors.length; i++) {
		for (let j = 0; j < shapes.length; j++) {
			const shape = shapes[j];
			const colorIndex = (i + j) % colors.length;
			const cellColor = colors[colorIndex];
			result.push({ shape, cellColor, textColor: "white" });
		}
	}

	return result;
})();

function gridLines(ctx: Ctx, tile: Tile, width: number, height: number): void {
	// Makes the lines look smoother
	ctx.translate(0.5, 0.5);

	for (let x = 1; x < width; x++) {
		ctx.beginPath();
		ctx.moveTo(tile(x), 0);
		ctx.lineTo(tile(x), tile(height));
		ctx.stroke();
	}

	for (let y = 1; y < height; y++) {
		ctx.beginPath();
		ctx.moveTo(0, tile(y));
		ctx.lineTo(tile(width), tile(y));
		ctx.stroke();
	}
	ctx.translate(-0.5, -0.5);
}

function latestMove(ctx: Ctx, tile: Tile, move: XY | null): void {
	if (move !== null) {
		ctx.fillStyle = "lime";
		ctx.fillRect(tile(move.x), tile(move.y), tile(1), tile(1));
	}
}

function player(
	ctx: Ctx,
	cx: number,
	cy: number,
	playerRender: PlayerRenderOptions,
	large: boolean,
	cellCount: number | null,
): void {
	const { cellColor, shape, textColor } = playerRender;

	ctx.save();

	ctx.fillStyle = cellColor;
	ctx.beginPath();
	ctx.translate(cx, cy);

	if (large) {
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

	if (cellCount !== null) {
		/**
		 * Simply setting the textBaseline to "middle" displays as expected
		 * on Chrome, but looks off on Firefox. As a workaround, offset the
		 * text manually.
		 */
		const TEXT_BASELINE_MIDDLE_OFSET = 0.075;
		ctx.fillStyle = textColor;

		ctx.textAlign = "center";

		// While it does say here that the unit is pixel, when drawing the
		// board the context gets scaled by the tile size, so effectively
		// this means that the text is 0.25 times the tile size.
		ctx.font = "0.25px sans-serif";

		ctx.fillText(String(cellCount), 0, TEXT_BASELINE_MIDDLE_OFSET);
	}

	ctx.restore();
}

function cell(
	ctx: Ctx,
	tile: Tile,
	x: number,
	y: number,
	game: ChainReaction,
	cell: OwnedCell,
	pos: number,
): void {
	assert(
		cell.owner < players.length,
		`Don't know how to render player ${cell.owner}.`,
	);
	const playerRender = players[cell.owner];

	const large = game.shouldExplode(pos);

	/** Don't bother rendering text if it's too small to read. */
	const MIN_TILE_SIZE_FOR_TEXT = 30;
	const renderText = tile(1) > MIN_TILE_SIZE_FOR_TEXT;
	const cellCount = renderText ? cell.count : null;
	player(ctx, x + 0.5, y + 0.5, playerRender, large, cellCount);
}

function cells(ctx: Ctx, tile: Tile, game: ChainReaction): void {
	ctx.scale(tile(1), tile(1));

	for (let pos = 0; pos < game.grid.length; pos++) {
		const { x, y } = toXY(pos, game.width);
		const _cell = game.grid[pos];
		if (_cell.type === CellType.Owned) {
			cell(ctx, tile, x, y, game, _cell, pos);
		}
	}

	ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function clear(ctx: Ctx): void {
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function board(ctx: Ctx, tile: Tile, game: ChainReaction): void {
	const lm =
		game.latestMove !== null
			? toXY(game.latestMove, game.width)
			: game.latestMove;

	clear(ctx);
	latestMove(ctx, tile, lm);
	gridLines(ctx, tile, game.width, game.height);
	cells(ctx, tile, game);
}

const defaultCanvasSize = new WeakMap<HTMLCanvasElement, number>();

export function resize(
	canvas: HTMLCanvasElement,
	tileSize: TileSize,
	game: ChainReaction,
): void {
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
}

export function getPlayerImages(): HTMLImageElement[] {
	const canvas = document.createElement("canvas");
	const SIZE = 48;
	canvas.width = SIZE;
	canvas.height = SIZE;
	const ctx = canvas.getContext("2d");
	assert(ctx);

	const images = players.map(renderOptions => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.scale(SIZE, SIZE);
		player(ctx, 0.5, 0.5, renderOptions, false, null);
		const img = new Image();
		img.src = canvas.toDataURL();
		return img;
	});

	return images;
}
