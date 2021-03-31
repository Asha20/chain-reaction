import m from "mithril";
import { Simulate } from "./Simulate";
import { defaultState } from "../state";
import { EventEmitter } from "../event_emitter";

const demoState = defaultState();
demoState.game.players.js = ["PlayUserInput", "PlayRandomly"];
demoState.game.runs = Infinity;

export const Demo: m.Component = {
	view() {
		return m(Simulate, {
			state: demoState,
			$state: EventEmitter(),
			include: { config: false, controls: false, tally: false },
		});
	},
};
