import "@public/style/index.scss";
import m from "mithril";
import { Demo } from "@ui";

const demo = document.getElementById("mount--demo");
if (demo) {
	m.mount(demo, Demo);
}
