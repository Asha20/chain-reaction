import m from "mithril";
import { classNames } from "@ui/util";
import { assert, throttle } from "@common/util";

interface ControlAttrs {
	currentPlayer: string;
	gameActive: boolean;
	manual: boolean;
	attachOnUpdate(fn: (currentPlayer: string) => void): () => void;

	onStart(): void;
	onCancel(): void;
	onAdvance(): void;
}

export function Controls(): m.Component<ControlAttrs> {
	let unsubscribe: () => void;

	return {
		oncreate(vnode) {
			// Instead of calling m.redraw() after every single
			// move made on the board, attach to the "update" event
			// of the game and directly mutate the relevant DOM element
			// so that the name of the current player to play is displayed.

			const { attachOnUpdate } = vnode.attrs;
			const dom = vnode.dom;
			const next = dom.querySelector(".controls__next");
			assert(next instanceof HTMLElement);

			unsubscribe = attachOnUpdate(
				throttle(50, currentPlayer => {
					next.textContent = currentPlayer;
				}),
			);
		},

		onremove() {
			unsubscribe();
		},

		view(vnode) {
			const {
				currentPlayer,
				gameActive,
				manual,
				onStart,
				onCancel,
				onAdvance,
			} = vnode.attrs;

			const Start = m(
				"button",
				{ disabled: gameActive, onclick: onStart },
				"Start",
			);

			const Cancel = m(
				"button",
				{ disabled: !gameActive, onclick: onCancel },
				"Cancel",
			);

			const Advance = m(
				"button",
				{
					class: classNames({ hide: !manual }),
					disabled: !gameActive,
					onclick: onAdvance,
				},
				"Advance",
			);

			return m(
				".controls",
				m(".controls__buttons", [Start, Cancel, Advance]),

				m(".controls__p", [
					m("p", [
						'Player "',
						m("span.controls__next", currentPlayer),
						'" to play.',
					]),
				]),
			);
		},
	};
}
