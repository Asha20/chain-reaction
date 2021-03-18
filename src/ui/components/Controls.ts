import { classNames } from "@ui/util";
import m from "mithril";
import { state } from "../state";

interface ControlAttrs {
	onStart(): void;
	onCancel(): void;
	onAdvance(): void;
}

export const Controls: m.Component<ControlAttrs> = {
	view(vnode) {
		const { onStart, onCancel, onAdvance } = vnode.attrs;

		return m(".controls.grid--controls", [
			m("button", { disabled: state.game.active, onclick: onStart }, "Start"),
			m(
				"button",
				{ disabled: !state.game.active, onclick: onCancel },
				"Cancel",
			),
			m(
				"button",
				{
					class: classNames({ hide: !state.manual }),
					disabled: !state.game.active,
					onclick: onAdvance,
				},
				"Advance",
			),
		]);
	},
};
