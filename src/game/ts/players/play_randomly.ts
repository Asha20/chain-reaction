import { Playable } from "../runner";
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
