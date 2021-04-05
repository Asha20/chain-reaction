import m from "mithril";
import { playerImages, PLAYER_IMAGE_SIZE } from "@ui/renderer/draw";
import { countingArray } from "@game/common";

interface TallyAttrs {
	players: number;
	tally: number[];
	gameId: number;
	runs: number;
}

export const Tally: m.Component<TallyAttrs> = {
	view(vnode) {
		const { tally, gameId, runs, players } = vnode.attrs;

		const playerScores = countingArray(players).map(i =>
			m("figure", { key: playerImages[i].name }, [
				m("img", {
					alt: playerImages[i].name,
					width: PLAYER_IMAGE_SIZE,
					height: PLAYER_IMAGE_SIZE,
					src: playerImages[i].data,
				}),
				m("figcaption", tally[i] ?? 0),
			]),
		);

		const showProgress = runs !== Infinity;

		return m(".tally", [
			m("h2", "Tally"),

			showProgress &&
				m("span.tally__progress", `Games completed: ${gameId}/${runs}`),

			m("section.tally__scores", playerScores),
		]);
	},
};
