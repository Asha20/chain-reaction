import m from "mithril";

interface TallyAttrs {
	tally: number[];
	gameId: number;
	runs: number;
}

export const Tally: m.Component<TallyAttrs> = {
	view(vnode) {
		const { tally, gameId, runs } = vnode.attrs;

		return m(".tally", [
			m("h2", "Tally"),
			m(".config__field--2", [
				m("span", "Score:"),
				m("span", tally.join(" - ")),
			]),

			m(".config__field--2", [
				m("span", "Progress:"),
				m("span", `${gameId}/${runs}`),
			]),
		]);
	},
};
