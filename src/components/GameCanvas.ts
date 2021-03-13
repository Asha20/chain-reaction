import m from "mithril";
import { assert, ChainReaction, mount, MountOptions } from "../game/ts/lib";

interface GameCanvasAttrs {
	game: ChainReaction;
	options: MountOptions;
}

type Nullable<T> = T | null;

export function GameCanvas(): m.Component<GameCanvasAttrs> {
	let unsubscribe: Nullable<() => void> = null;

	function attach(vnode: m.VnodeDOM<GameCanvasAttrs>) {
		const { game, options } = vnode.attrs;
		const canvas = vnode.dom;

		assert(canvas instanceof HTMLCanvasElement);
		unsubscribe = mount(game, canvas, options);
	}

	return {
		oncreate: attach,
		onupdate: attach,

		onremove() {
			unsubscribe?.();
		},

		view() {
			return m("canvas");
		},
	};
}
