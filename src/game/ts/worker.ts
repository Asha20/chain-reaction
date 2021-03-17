import { RunMessage } from "./wasm_runner";

/* eslint-env worker */
declare const self: Worker;

self.addEventListener("message", async e => {
	const data = e.data as RunMessage;
	const mod = await import("../../game/rust/pkg/index");

	const result = mod.run(
		data.width,
		data.height,
		data.players,
		data.runs,
		data.controlBuffer,
		data.tallyBuffer,
	);
	self.postMessage([...result]);
});
