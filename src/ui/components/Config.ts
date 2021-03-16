import m from "mithril";
import { state, defaults } from "@ui/state";
import { NumberInput } from "./NumberInput";

interface ConfigAttrs {
	disabled: boolean;

	setWidth(value: number): void;
	setHeight(value: number): void;
	setRuns(value: number): void;
	setExplosionDelay(value: number): void;
	setTurnDelay(value: number): void;
	toggleManualProgress(): void;
}

export const Config: m.Component<ConfigAttrs> = {
	view(vnode) {
		const {
			disabled,
			setWidth,
			setHeight,
			setRuns,
			setExplosionDelay,
			setTurnDelay,
			toggleManualProgress,
		} = vnode.attrs;

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
					onChange: setWidth,
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
					onChange: setHeight,
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
					onChange: setRuns,
				}),
			),

			m(".config__field--2", [
				m("label[for=progress-manually]", "Progress manually:"),
				m("input#progress-manually[type=checkbox]", {
					checked: state.game.manual,
					onclick: toggleManualProgress,
				}),
			]),

			m("div", { hidden: state.game.manual }, [
				m(
					".config__field--2",
					m(NumberInput, {
						disabled,
						id: "explosion-delay",
						label: "Explosion delay:",
						defaultValue: state.game.explosionDelay,
						min: defaults.game.explosionDelay.min,
						max: defaults.game.explosionDelay.max,
						onChange: setExplosionDelay,
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
						onChange: setTurnDelay,
					}),
				),
			]),
		]);
	},
};
