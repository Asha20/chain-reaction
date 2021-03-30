import m from "mithril";
import { PlayerRenderOptions } from "@game";
import { GameCanvas } from "./GameCanvas";
import { Config } from "./Config";
import { Controls } from "./Controls";
import { Grid } from "./Grid";
import { Tally } from "./Tally";
import { Simulator } from "../simulator";
import { State, StateEmitter } from "@ui/state";

const players: PlayerRenderOptions[] = [
	{
		cellColor: "red",
		textColor: "white",
		shape: "circle",
	},
	{
		cellColor: "blue",
		textColor: "white",
		shape: "star",
	},
	{
		cellColor: "green",
		textColor: "white",
		shape: "square",
	},
	{
		cellColor: "purple",
		textColor: "white",
		shape: "diamond",
	},
];

interface SimulateAttrs {
	state: State;
	$state: StateEmitter;
}

export const Simulate: m.FactoryComponent<SimulateAttrs> = function (vnode) {
	const { state, $state } = vnode.attrs;

	const wrapWithRedraw = (fn: () => unknown) => async () => {
		const result = await fn();
		m.redraw();
		return result;
	};

	const simulator = Simulator(state, $state);
	const run = wrapWithRedraw(simulator.run);
	const update = wrapWithRedraw(simulator.update);
	const advance = wrapWithRedraw(simulator.advance);

	let unsubscribeRefresh: () => void;
	let unsubscribeActive: () => void;

	return {
		oninit() {
			unsubscribeRefresh = $state.on("refresh", () => m.redraw());
			unsubscribeActive = $state.on("active", val => {
				if (!val) {
					m.redraw();
				}
			});
		},

		onremove() {
			unsubscribeRefresh();
			unsubscribeActive();
		},

		async oncreate(vnode) {
			const canvasBoard = vnode.dom.querySelector<HTMLCanvasElement>(".board");

			if (canvasBoard) {
				simulator.HumanPlayer().setCanvas(canvasBoard);
				void update();
			} else {
				// Redraw so that mounting inside GameCanvas can use
				// canvas.getBoundingClientRect() and get proper values from it.
				m.redraw();
			}
		},

		view(vnode) {
			const { state, $state } = vnode.attrs;

			return m(Grid, {
				canvas: m(GameCanvas, {
					game: simulator.game(),
					options: { players },
				}),
				controls: m(Controls, {
					onStart: run,
					onCancel: update,
					onAdvance: advance,
				}),
				tally: m(Tally, {
					tally: simulator.tally(),
					gameId: simulator.gameId(),
					runs: state.game.runs,
				}),
				config: m(Config, { disabled: state.game.active, state, $state }),
			});
		},
	};
};