import { Playable } from "../runner";
import { XY } from "../common";
import { Player } from "./common";

interface PlayerUserInput extends Playable {
	setCanvas(canvas: HTMLCanvasElement): void;
	setBoardSize(width: number, height: number): void;
}

function waitForTouch(element: HTMLElement): Promise<XY> {
	return new Promise(resolve => {
		function removeHandlers() {
			element.removeEventListener("click", clickHandler);
			element.removeEventListener("touchstart", touchStartHandler);
		}

		function clickHandler(e: MouseEvent) {
			removeHandlers();
			resolve({ x: e.clientX, y: e.clientY });
		}

		function touchStartHandler(e: TouchEvent) {
			e.preventDefault();
			removeHandlers();
			resolve({ x: e.touches[0].clientX, y: e.touches[0].clientY });
		}

		element.addEventListener("click", clickHandler, { once: true });
		element.addEventListener("touchstart", touchStartHandler, {
			passive: false,
			once: true,
		});
	});
}

function create(): PlayerUserInput {
	let _canvas: HTMLCanvasElement | null = null;
	let _width = 0;
	let _height = 0;

	return {
		setCanvas(canvas) {
			_canvas = canvas;
		},

		setBoardSize(width, height) {
			_width = width;
			_height = height;
		},

		async play({ canPlace }) {
			if (_canvas === null) {
				throw new Error("No canvas supplied.");
			}

			if (_width === 0 || _height === 0) {
				throw new Error("No board size supplied.");
			}

			// eslint-disable-next-line no-constant-condition
			while (true) {
				const { x: clientX, y: clientY } = await waitForTouch(_canvas);
				const rect = _canvas.getBoundingClientRect();

				const posX = clientX - rect.left;
				const posY = clientY - rect.top;

				const x = Math.floor(
					(posX / _canvas.width) * _width * window.devicePixelRatio,
				);
				const y = Math.floor(
					(posY / _canvas.height) * _height * window.devicePixelRatio,
				);

				if (canPlace(x, y)) {
					return { x, y };
				}
			}
		},
	};
}

export const PlayUserInput: Player<"PlayUserInput", PlayerUserInput> = {
	meta: {
		id: "PlayUserInput",
		name: "Human player",
		description: "Click on the board to make a move yourself.",
	},
	create,
};
