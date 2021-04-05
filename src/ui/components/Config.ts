import m from "mithril";
import { defaults, State, StateEmitter } from "@ui/state";
import { NumberInput } from "./NumberInput";
import { classNames, supportsWasm } from "@ui/util";

interface ConfigAttrs {
	disabled: boolean;
	state: State;
	$state: StateEmitter;

	include?: Partial<{
		width: boolean;
		height: boolean;
		runs: boolean;
		wasm: boolean;
		manual: boolean;
		explosionDelay: boolean;
		turnDelay: boolean;
		gameDelay: boolean;
		players: boolean;
	}>;
}

const defaultInclude: NonNullable<Required<ConfigAttrs["include"]>> = {
	width: true,
	height: true,
	runs: true,
	wasm: true,
	manual: true,
	explosionDelay: true,
	turnDelay: true,
	gameDelay: true,
	players: true,
};

export function Config(): m.Component<ConfigAttrs> {
	return {
		view(vnode) {
			const { disabled, state, $state } = vnode.attrs;
			const hideDelayConfig = state.manual || state.wasm;

			const include = { ...defaultInclude, ...(vnode.attrs.include ?? {}) };

			const boardSettings =
				include.width ||
				include.height ||
				include.runs ||
				include.explosionDelay ||
				include.turnDelay ||
				include.gameDelay ||
				include.wasm ||
				include.manual;

			const playersArray = state.wasm
				? state.game.players.wasm
				: state.game.players.js;

			const BoardWidth =
				include.width &&
				m(
					".config__field--2",
					m(NumberInput, {
						disabled,
						id: "board-width",
						label: "Board width:",
						defaultValue: state.game.width,
						min: defaults.game.width.min,
						max: defaults.game.width.max,
						onChange: x => $state.emit("width", x),
					}),
				);

			const BoardHeight =
				include.height &&
				m(
					".config__field--2",
					m(NumberInput, {
						disabled,
						id: "board-height",
						label: "Board height:",
						defaultValue: state.game.height,
						min: defaults.game.height.min,
						max: defaults.game.height.max,
						onChange: x => $state.emit("height", x),
					}),
				);

			const NumberOfRuns =
				include.runs &&
				m(
					".config__field--2",
					m(NumberInput, {
						disabled,
						id: "runs",
						label: "Number of runs:",
						defaultValue: state.game.runs,
						min: defaults.game.runs.min,
						max: defaults.game.runs.max,
						onChange: x => $state.emit("runs", x),
					}),
				);

			const UseWASM =
				include.wasm &&
				m(".config__field--2", [
					m("label[for=use-wasm]", "Use WASM:"),
					supportsWasm
						? m("input#use-wasm[type=checkbox]", {
								checked: state.wasm,
								onclick: () => $state.emit("wasm", !state.wasm),
						  })
						: m("span", "Not supported"),
				]);

			const StepByStep =
				include.manual &&
				m(".config__field--2", { class: classNames({ hide: state.wasm }) }, [
					m("label[for=step-by-step]", "Step by step:"),
					m("input#step-by-step[type=checkbox]", {
						checked: state.manual,
						onclick: () => $state.emit("manual", !state.manual),
					}),
				]);

			const ExplosionDelay =
				include.explosionDelay &&
				m(
					".config__field--2",
					m(NumberInput, {
						disabled,
						id: "explosion-delay",
						label: "Explosion delay:",
						defaultValue: state.game.explosionDelay,
						min: defaults.game.explosionDelay.min,
						max: defaults.game.explosionDelay.max,
						onChange: x => $state.emit("explosionDelay", x),
					}),
				);

			const TurnDelay =
				include.turnDelay &&
				m(
					".config__field--2",
					m(NumberInput, {
						disabled,
						id: "turn-delay",
						label: "Turn delay:",
						defaultValue: state.game.turnDelay,
						min: defaults.game.turnDelay.min,
						max: defaults.game.turnDelay.max,
						onChange: x => $state.emit("turnDelay", x),
					}),
				);

			const GameDelay =
				include.gameDelay &&
				m(
					".config__field--2",
					m(NumberInput, {
						disabled,
						id: "game-delay",
						label: "Game delay:",
						defaultValue: state.game.gameDelay,
						min: defaults.game.gameDelay.min,
						max: defaults.game.gameDelay.max,
						onChange: x => $state.emit("gameDelay", x),
					}),
				);

			const NumberOfPlayers =
				include.players &&
				m(
					".config__field--2",
					m(NumberInput, {
						disabled,
						id: "player-count",
						label: "Players:",
						defaultValue: playersArray.length,
						min: defaults.game.players.min,
						max: Math.min(
							defaults.game.players.max,
							state.game.width * state.game.height,
						),
						onChange: x => {
							$state.emit("updatePlayerCountWASM", x);
							$state.emit("updatePlayerCountJS", x);
						},
					}),
				);

			return m(".config", [
				m("h2", "Configuration"),
				boardSettings && m("h3", "Board settings"),

				BoardWidth,
				BoardHeight,
				NumberOfRuns,

				UseWASM,
				StepByStep,

				m("div", { class: classNames({ hide: hideDelayConfig }) }, [
					ExplosionDelay,
					TurnDelay,
					GameDelay,
				]),

				NumberOfPlayers,
			]);
		},
	};
}
