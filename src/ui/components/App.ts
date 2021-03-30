import m from "mithril";
import { state, $state } from "../state";
import { Simulate } from "./Simulate";

export const App: m.Component = {
	view() {
		return m(Simulate, { state, $state });
	},
};
