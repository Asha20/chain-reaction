import "../public/style/index.scss";
import m from "mithril";
import { App } from "./components/App";

const app = document.getElementById("app");
if (app) {
	m.mount(app, App);
}
