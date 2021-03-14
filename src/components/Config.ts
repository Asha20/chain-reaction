import m from "mithril";
import { NumberInput } from "./NumberInput";

interface ConfigAttrs {
	setWidth(value: number): void;
	setHeight(value: number): void;
	setRuns(value: number): void;
}

export const Config: m.Component<ConfigAttrs> = {
	view(vnode) {
		const { setWidth, setHeight, setRuns } = vnode.attrs;

		return [
			m("h2", "Configuration"),

			m(NumberInput, {
				label: "Board width",
				defaultValue: 3,
				min: 2,
				max: 10,
				onChange: setWidth,
			}),

			m(NumberInput, {
				label: "Board height",
				defaultValue: 3,
				min: 2,
				max: 10,
				onChange: setHeight,
			}),

			m(NumberInput, {
				label: "Number of runs",
				defaultValue: 3,
				min: 2,
				max: 10,
				onChange: setRuns,
			}),
		];
	},
};
