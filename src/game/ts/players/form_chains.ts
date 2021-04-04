import { Playable } from "../runner";
import { random } from "@common/util";
import { createStatefulPlayer, toXY } from "./common";

function create(): Playable {
	let current = -1;

	return {
		play({ width, availableCells, mass, capacity, neighbors }) {
			const available = availableCells();
			const nonCritical = [...available].filter(p => mass(p) < capacity(p) - 1);

			const choice = nonCritical.length ? nonCritical : [...available];

			if (!available.has(current)) {
				const index = Math.floor(choice.length * random());
				current = choice[index];
			} else if (mass(current) === capacity(current) - 1) {
				const ns = neighbors(current).filter(
					n => available.has(n) && mass(n) < capacity(current) - 1,
				);

				if (ns.length) {
					const index = Math.floor(ns.length * random());
					current = ns[index];
				} else {
					const index = Math.floor(choice.length * random());
					current = choice[index];
				}
			}

			return toXY(current, width);
		},
	};
}

export const FormChains = createStatefulPlayer(create, {
	id: "FormChains",
	wasm: true,
	name: "Form chains",
	description:
		"Avoid triggering an explosion as much as possible while also putting the maximum amount of mass into own cells.",
});
