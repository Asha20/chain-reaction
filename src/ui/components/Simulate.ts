import m from "mithril";
import { GameCanvas } from "./GameCanvas";
import { Config } from "./Config";
import { Controls } from "./Controls";
import { Grid } from "./Grid";
import { Tally } from "./Tally";
import { Simulator } from "../simulator";
import { State, StateEmitter } from "@ui/state";

interface SimulateAttrs {
	state: State;
	$state: StateEmitter;

	wrapper?: string;

	include?: Partial<{
		controls: boolean;
		tally: boolean;
		config: boolean;
	}>;
}

const defaultInclude: NonNullable<Required<SimulateAttrs["include"]>> = {
	controls: true,
	tally: true,
	config: true,
};

export const Simulate: m.FactoryComponent<SimulateAttrs> = function (vnode) {
	const { state, $state, wrapper } = vnode.attrs;

	const include = { ...defaultInclude, ...(vnode.attrs.include ?? {}) };

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
				wrapper,

				canvas: m(GameCanvas, { game: simulator.game() }),
				controls: include.controls
					? m(Controls, {
							onStart: run,
							onCancel: update,
							onAdvance: advance,
					  })
					: undefined,
				tally: include.tally
					? m(Tally, {
							tally: simulator.tally(),
							gameId: simulator.gameId(),
							runs: state.game.runs,
					  })
					: undefined,
				config: include.config
					? m(Config, { disabled: state.game.active, state, $state })
					: undefined,
			});
		},
	};
};
