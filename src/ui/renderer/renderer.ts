import { ChainReaction } from "@game/chain_reaction";
import { assert, debounce } from "@common/util";
import * as draw from "./draw";

function validateOptions(game: ChainReaction) {
	assert(
		draw.players.length >= game.players,
		`Game has ${game.players} players, but I only know how to render ${draw.players.length}.`,
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
): () => void {
	validateOptions(game);
	const ctx = getContext(canvas);

	const tileSize: draw.TileSize = {
		value: 0,

		update(maxWidth: number) {
			this.value = Math.floor(maxWidth / Math.max(game.width, game.height));
		},
	};

	const resize = () => {
		draw.resize(canvas, tileSize, game);
		boundDraw();
	};

	const tile = (x: number) => x * window.devicePixelRatio * tileSize.value;
	const boundDraw = () => draw.board(ctx, tile, game);

	resize();

	const onResizeHandler = debounce(50, resize);
	window.addEventListener("resize", onResizeHandler);

	const unsubscribeFromUpdate = game.hooks.add("update", boundDraw);
	const unsubscribeFromResize = () => {
		window.removeEventListener("resize", onResizeHandler);
	};

	const unsubscribe = () => {
		unsubscribeFromUpdate();
		unsubscribeFromResize();
	};

	return unsubscribe;
}
