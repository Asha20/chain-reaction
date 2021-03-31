import "@public/style/index.scss";
import m from "mithril";
import { App } from "@ui";

const app = document.getElementById("mount--simulator");
if (app) {
	m.mount(app, App);
}
