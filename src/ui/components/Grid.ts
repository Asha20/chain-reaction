import m from "mithril";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyVnode = m.Vnode<any, any>;

interface GridAttrs {
	wrapper?: string;

	canvas: AnyVnode;
	controls?: AnyVnode | undefined;
	tally?: AnyVnode | undefined;
	config?: AnyVnode | undefined;
}

export const Grid: m.Component<GridAttrs> = {
	view(vnode) {
		const { wrapper, canvas, controls, tally, config } = vnode.attrs;

		const children = [
			m(".grid--canvas", canvas),
			controls && m(".grid--controls", controls),
			tally && m(".grid--tally", tally),
			config && m(".grid--config", config),
		];

		return wrapper ? m(wrapper, children) : children;
	},
};
