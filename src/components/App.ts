import m from "mithril";
import { PlayRandomly, Runner, sleep } from "../game/ts/lib";
import { GameCanvas } from "./GameCanvas";

const runner = new Runner({
	width: 3,
	height: 3,
	players: [PlayRandomly, PlayRandomly],
});
const colors = ["red", "blue"];
const tileSize = 100;

export const App: m.Component = {
	oncreate() {
		runner.game.addHook("update", () => sleep(200));
		runner.run(10);
	},

	view() {
		return m("div", [
			m("p", "My app"),
			m(GameCanvas, { game: runner.game, options: { colors, tileSize } }),
		]);
	},
};
