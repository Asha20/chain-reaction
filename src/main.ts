import "@public/style/index.scss";
import m from "mithril";
import { App } from "@ui";

const app = document.getElementById("app");
if (app) {
	m.mount(app, App);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function printError(e: any) {
	const msg = `${e.type}: ${e.message};`;
	alert(msg);
	document.body.appendChild(new Text(msg));
}

window.addEventListener("error", printError);
window.addEventListener("unhandledrejection", printError);
