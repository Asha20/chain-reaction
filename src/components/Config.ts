import m from "mithril";
import { restrict } from "../game/ts/util";

interface ConfigAttrs {
	width: number;
	height: number;
	runs: number;

	cancel(): void;
	setWidth(value: number): void;
	setHeight(value: number): void;
	setRuns(value: number): void;
}

const MIN_SIZE = 2;
const MAX_SIZE = 10;

const identity = <T>(x: T) => x;

function updateField<T>(
	oldValue: T,
	callback: (x: T) => void,
	mapping: (e: InputEvent) => T,
) {
	return function _updateField(e: InputEvent) {
		const newValue = mapping(e);
		if (newValue !== oldValue) {
			callback(newValue);
		}
	};
}

function updateNumberField(
	oldValue: number,
	callback: (x: number) => void,
	mapping: (x: number) => number = identity,
) {
	return updateField(oldValue, callback, e => {
		const value = Number((e.target as HTMLInputElement).value);
		return mapping(value);
	});
}

const restrictBoardSize = restrict(MIN_SIZE, MAX_SIZE);

export const Config: m.Component<ConfigAttrs> = {
	view(vnode) {
		const {
			width,
			height,
			runs,
			cancel,
			setWidth,
			setHeight,
			setRuns,
		} = vnode.attrs;

		const updateWidth = updateNumberField(width, setWidth, restrictBoardSize);
		const updateHeight = updateNumberField(width, setHeight, restrictBoardSize);
		const updateRuns = updateNumberField(width, setRuns);

		return [
			m("button", { onclick: cancel }, "Cancel"),

			m("label", "Width", m("input", { value: width, oninput: updateWidth })),
			m(
				"label",
				"Height",
				m("input", { value: height, oninput: updateHeight }),
			),
			m("label", "Runs", m("input", { value: runs, oninput: updateRuns })),
		];
	},
};
