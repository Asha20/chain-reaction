import m from "mithril";
import { Players } from "@game";

interface PlayerInfoAttrs {
	players: Players[];
}

export const PlayerInfo: m.Component<PlayerInfoAttrs> = {
	view(vnode) {
		const { players } = vnode.attrs;

		return m(".player-info", [
			m("h2", "Explanations of strategies"),

			m(
				"ul",
				players.map(player =>
					m(
						"li",
						{ key: player.meta.id },
						m("strong", player.meta.name + ": "),
						player.meta.description,
					),
				),
			),
		]);
	},
};
