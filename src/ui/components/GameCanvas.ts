import m from "mithril";
import { assert } from "@common/util";
import { ChainReaction } from "@game";
import { mount } from "@ui";

interface GameCanvasAttrs {
	game: ChainReaction;
}

type Nullable<T> = T | null;

export function GameCanvas(): m.Component<GameCanvasAttrs> {
	let unsubscribe: Nullable<() => void> = null;

	function attach(vnode: m.VnodeDOM<GameCanvasAttrs>) {
		const { game } = vnode.attrs;
		const canvas = vnode.dom;
		assert(canvas instanceof HTMLCanvasElement);
		unsubscribe = mount(game, canvas);
	}

	return {
		oncreate: attach,
		onupdate: attach,

		onremove() {
			unsubscribe?.();
		},

		view() {
			return m("canvas.board");
		},
	};
}
