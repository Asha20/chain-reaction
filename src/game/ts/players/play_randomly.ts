import { Playable } from "../runner";
import { random } from "@common/util";
import { createPlayer, toXY } from "./common";

const singleton: Playable = {
	play({ width, availableCells }) {
		const available = availableCells();
		const index = Math.floor(available.size * random());
		const pos = [...available][index];

		return toXY(pos, width);
	},
};

export const PlayRandomly = createPlayer(singleton, {
	id: "PlayRandomly",
	wasm: true,
	name: "Play randomly",
	description: "Places a cell on a random available position.",
});
