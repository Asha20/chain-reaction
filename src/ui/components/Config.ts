import m from "mithril";
import { state, $state, defaults } from "@ui/state";
import { NumberInput } from "./NumberInput";
import { classNames } from "@ui/util";
import { getPlayerMeta, JsPlayerName, playersJS } from "@game";
import { array } from "@common/util";

interface ConfigAttrs {
	disabled: boolean;
}

interface SelectAttrs {
	id: string;
	disabled: boolean;
	options: Array<{ value: string; name: string }>;
	onChange(value: string): void;
}

const Select: m.Component<SelectAttrs> = {
	view(vnode) {
		const { onChange, options, id, disabled } = vnode.attrs;

		return m(
			"select",
			{
				id,
				disabled,
				onchange: (e: Event) => {
					if (!disabled) {
						onChange((e.target as HTMLSelectElement).value);
					}
				},
			},
			options.map(({ name, value }) => m("option", { value }, name)),
		);
	},
};

const playersJSOptions = playersJS.map(id => {
	const meta = getPlayerMeta(id);
	return { value: meta.id, name: meta.name };
});

export function Config(): m.Component<ConfigAttrs> {
	return {
		view(vnode) {
			const { disabled } = vnode.attrs;
			const hideDelayConfig = state.manual || state.wasm;

			const BoardWidth = m(
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

			const BoardHeight = m(
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

			const NumberOfRuns = m(
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

			const UseWASM = m(".config__field--2", [
				m("label[for=use-wasm]", "Use WASM:"),
				m("input#use-wasm[type=checkbox]", {
					checked: state.wasm,
					onclick: () => $state.emit("wasm", !state.wasm),
				}),
			]);

			const StepByStep = m(
				".config__field--2",
				{ class: classNames({ hide: state.wasm }) },
				[
					m("label[for=step-by-step]", "Step by step:"),
					m("input#step-by-step[type=checkbox]", {
						checked: state.manual,
						onclick: () => $state.emit("manual", !state.manual),
					}),
				],
			);

			const ExplosionDelay = m(
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

			const TurnDelay = m(
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

			const GameDelay = m(
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

			const NumberOfPlayers = m(
				".config__field--2",
				m(NumberInput, {
					disabled,
					id: "player-count",
					label: "Players:",
					defaultValue: state.game.players.js.length,
					min: defaults.game.players.min,
					max: defaults.game.players.max,
					onChange: x => $state.emit("updatePlayerCountJS", x),
				}),
			);

			const PlayerSelect = (id: number) =>
				m(".config__field--2.config__field--select", { key: id }, [
					m("label", { for: `player-${id}` }, `Player ${id + 1}:`),

					m(Select, {
						id: `player-${id}`,
						disabled,
						options: playersJSOptions,
						onChange: x => $state.emit("updatePlayerJS", id, x as JsPlayerName),
					}),
				]);

			return m(".config.grid--config", [
				m("h2", "Configuration"),
				m("h3", "Board settings"),

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

				m("h3", "Players"),

				NumberOfPlayers,
				array(state.game.players.js.length, PlayerSelect),
			]);
		},
	};
}
