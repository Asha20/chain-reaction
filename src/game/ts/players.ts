import { XY } from "./chain_reaction";
import { Playable } from "./runner";
import { random } from "@common/util";

export const PlayRandomly: Playable<"PlayRandomly"> = {
	name: "PlayRandomly",
	play({ width, height, canPlace }) {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const x = Math.floor(width * random());
			const y = Math.floor(height * random());

			if (canPlace(x, y)) {
				return { x, y };
			}
		}
	},
};

export function PlayPos(pos: XY): Playable<"PlayPos"> {
	return {
		name: "PlayPos",
		play() {
			return pos;
		},
	};
}

interface PlayerUserInput extends Playable<"PlayUserInput"> {
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

export function PlayUserInput(): PlayerUserInput {
	let _canvas: HTMLCanvasElement | null = null;
	let _width = 0;
	let _height = 0;

	return {
		name: "PlayUserInput",

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

type GetPlayer<
	T extends Playable | ((...args: never[]) => Playable)
> = T extends (...args: never[]) => infer U ? U : T;

export type Player = GetPlayer<
	typeof PlayRandomly | typeof PlayPos | typeof PlayUserInput
>;
