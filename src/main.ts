import "@public/style/index.scss";
import m from "mithril";
import { App } from "@ui";

const app = document.getElementById("app");
if (app) {
	m.mount(app, App);
}

function printError(e: ErrorEvent | PromiseRejectionEvent) {
	const reason = e instanceof ErrorEvent ? e.message : e.reason;
	const msg = `${e.type}: ${reason};`;
	alert(msg);
	document.body.appendChild(new Text(msg));
}

window.addEventListener("error", printError);
window.addEventListener("unhandledrejection", printError);
