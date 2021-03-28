import m from "mithril";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyVnode = m.Vnode<any, any>;

interface GridAttrs {
	canvas: AnyVnode;
	controls: AnyVnode;
	tally: AnyVnode;
	config: AnyVnode;
}

export const Grid: m.Component<GridAttrs> = {
	view(vnode) {
		const { canvas, controls, tally, config } = vnode.attrs;

		return [
			m(".grid--canvas", canvas),
			m(".grid--controls", controls),
			m(".grid--tally", tally),
			m(".grid--config", config),
		];
	},
};
