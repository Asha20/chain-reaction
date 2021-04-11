import m from "mithril";
import { Simulate } from "./Simulate";
import { defaultState } from "../state";
import { EventEmitter } from "../event_emitter";
import { overwrite } from "@ui/util";

const demoState = overwrite(defaultState(), {
	game: {
		runs: Infinity,
		players: {
			js: ["PlayUserInput", "PlayRandomly"],
		},

		turnDelay: 500,
		explosionDelay: 500,
		gameDelay: 1000,
	},
});

export const Demo: m.Component = {
	view() {
		return m(Simulate, {
			state: demoState,
			$state: EventEmitter(),
			include: {
				config: false,
				controls: false,
				tally: false,
				players: false,
				playerInfo: false,
			},
		});
	},
};
