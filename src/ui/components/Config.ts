import m from "mithril";
import { state, defaults } from "@ui/state";
import { NumberInput } from "./NumberInput";

interface ConfigAttrs {
	disabled: boolean;

	setWidth(value: number): void;
	setHeight(value: number): void;
	setRuns(value: number): void;
}

export const Config: m.Component<ConfigAttrs> = {
	view(vnode) {
		const { disabled, setWidth, setHeight, setRuns } = vnode.attrs;

		return m(".config", [
			m("h2", "Configuration"),

			m(
				".config__field",
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
				".config__field",
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
				".config__field",
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
		]);
	},
};
