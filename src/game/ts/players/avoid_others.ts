import { Playable } from "../runner";
import { Player, toXY } from "./common";

const singleton: Playable = {
	play({ width, availableCells, neighbors, mass }) {
		const choice = [...availableCells()]
			.map(pos => ({
				pos,
				neighborMass: neighbors(pos)
					.map(mass)
					.reduce((acc, x) => acc + x, 0),
			}))
			.sort((a, b) => a.neighborMass - b.neighborMass);

		return toXY(choice[0].pos, width);
	},
};

export const AvoidOthers: Player<"AvoidOthers"> = {
	meta: {
		id: "AvoidOthers",
		name: "Avoid others",
		description: "Avoids placing cells in dense areas.",
	},
	create() {
		return singleton;
	},
};
