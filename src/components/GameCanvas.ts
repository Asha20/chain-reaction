import m from "mithril";
import { assert, ChainReaction, mount, MountOptions } from "../game/ts/lib";

interface GameCanvasAttrs {
	game: ChainReaction;
	options: MountOptions;
}

type Nullable<T> = T | null;

export function GameCanvas(): m.Component<GameCanvasAttrs> {
	let unsubscribe: Nullable<() => void> = null;

	return {
		oncreate(vnode) {
			const { game, options } = vnode.attrs;
			const canvas = vnode.dom;
			assert(canvas instanceof HTMLCanvasElement);
			unsubscribe = mount(game, canvas, options);
		},

		onremove() {
			unsubscribe?.();
		},

		view() {
			return m("canvas");
		},
	};
}
