import m from "mithril";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyVnode = m.Vnode<any, any>;

interface GridAttrs {
	wrapper?: string;

	canvas: AnyVnode;
	controls?: AnyVnode | undefined;
	tally?: AnyVnode | undefined;
	config?: AnyVnode | undefined;
	players?: AnyVnode | undefined;
	playerInfo?: AnyVnode | undefined;
}

export const Grid: m.Component<GridAttrs> = {
	view(vnode) {
		const {
			wrapper,
			canvas,
			controls,
			tally,
			config,
			players,
			playerInfo,
		} = vnode.attrs;

		const children = [
			m(".grid--canvas", canvas),
			controls && m(".grid--controls", controls),
			tally && m(".grid--tally", tally),
			config && m(".grid--config", config),
			players && m(".grid--players", players),
			playerInfo && m(".grid--player-info", playerInfo),
		];

		return wrapper ? m(wrapper, children) : children;
	},
};
