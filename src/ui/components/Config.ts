import m from "mithril";
import { state, $state, defaults } from "@ui/state";
import { NumberInput } from "./NumberInput";
import { classNames } from "@ui/util";

interface ConfigAttrs {
	disabled: boolean;
}

export const Config: m.Component<ConfigAttrs> = {
	view(vnode) {
		const { disabled } = vnode.attrs;

		const hideDelayConfig = state.manual || state.wasm;

		return m(".config.grid--config", [
			m("h2", "Configuration"),

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
			),

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
			),

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
			),

			m(".config__field--2", [
				m("label[for=use-wasm]", "Use WASM:"),
				m("input#use-wasm[type=checkbox]", {
					checked: state.wasm,
					onclick: () => $state.emit("wasm", !state.wasm),
				}),
			]),

			m(".config__field--2", { class: classNames({ hide: state.wasm }) }, [
				m("label[for=step-by-step]", "Step by step:"),
				m("input#step-by-step[type=checkbox]", {
					checked: state.manual,
					onclick: () => $state.emit("manual", !state.manual),
				}),
			]),

			m(".config__field--2", { class: classNames({ hide: state.wasm }) }, [
				m("label[for=pvp]", "PvP:"),
				m("input#pvp[type=checkbox]", {
					checked: state.pvp,
					onclick: () => $state.emit("pvp", !state.pvp),
				}),
			]),

			m("div", { class: classNames({ hide: hideDelayConfig }) }, [
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
				),

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
				),

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
				),
			]),
		]);
	},
};
