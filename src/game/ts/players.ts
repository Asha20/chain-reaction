import { XY } from "./chain_reaction";
import { Playable } from "./runner";
import { random, waitForEvent } from "@common/util";

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
				const e = await waitForEvent(_canvas, "click");
				const rect = _canvas.getBoundingClientRect();

				const posX = e.clientX - rect.left;
				const posY = e.clientY - rect.top;

				const x = Math.floor((posX / _canvas.width) * _width);
				const y = Math.floor((posY / _canvas.height) * _height);

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
