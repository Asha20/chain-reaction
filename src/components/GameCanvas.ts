import m from "mithril";
import { assert, ChainReaction, mount, MountOptions } from "../game/ts/lib";

interface GameCanvasAttrs {
	game: ChainReaction;
	options: Omit<MountOptions, "width" | "height">;
}

type Nullable<T> = T | null;

export function GameCanvas(): m.Component<GameCanvasAttrs> {
	let unsubscribe: Nullable<() => void> = null;

	function attach(vnode: m.VnodeDOM<GameCanvasAttrs>) {
		const { game, options } = vnode.attrs;
		const canvas = vnode.dom;
		assert(canvas instanceof HTMLCanvasElement);

		const { width, height } = canvas.getBoundingClientRect();
		canvas.width = width;
		canvas.height = height;

		const { colors } = options;
		unsubscribe = mount(game, canvas, { colors, width, height });
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
