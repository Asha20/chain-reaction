import m from "mithril";

interface TallyAttrs {
	tally: number[];
	gameId: number;
	runs: number;
}

export const Tally: m.Component<TallyAttrs> = {
	view(vnode) {
		const { tally, gameId, runs } = vnode.attrs;

		return [
			m("h2", "Tally"),
			m(".config__field", [
				m("span", "Score:"),
				m("span.ta-left", tally.join(" - ")),
			]),

			m(".config__field", [
				m("span", "Progress:"),
				m("span.ta-left", `${gameId}/${runs}`),
			]),
		];
	},
};
