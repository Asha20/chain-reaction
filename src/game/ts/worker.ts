import { array } from "@common/util";
import { WasmPlayerName } from "./players";
import { RunMessage, WorkerMessage, RunOptions } from "./wasm_runner";

/* eslint-env worker */
declare const self: Worker;

interface State {
	options: RunOptions;

	tally: number[];
	gameId: number;
	runsPerBatch: number;
}

function reply(msg: WorkerMessage) {
	self.postMessage(msg);
}

const state: State = {
	options: { width: 0, height: 0, players: [], runs: 0 },

	tally: [],
	gameId: 0,
	runsPerBatch: 0,
};

function mapWasmPlayer(player: WasmPlayerName) {
	switch (player) {
		case "PlayRandomly":
			return 0;
		case "AvoidOthers":
			return 1;
		case "FormChains":
			return 2;
		default:
			throw new Error(`Player ${player} isn't supported in WASM mode.`);
	}
}

function resolvePlayers(players: readonly WasmPlayerName[]) {
	const result = new Uint32Array(players.length);

	players.forEach((player, i) => (result[i] = mapWasmPlayer(player)));
	return result;
}

/**
 * See src/game/ts/wasm_runner.ts for a detailed explanation
 * of how this worker functions.
 */

self.addEventListener("message", async (e: MessageEvent<RunMessage>) => {
	const msg = e.data;
	const mod = await import("../../game/rust/pkg/index");

	// SharedArrayBuffer strategy

	if (msg.type === "sharedBuffer:start") {
		const result = mod.run_with_shared_buffer(
			msg.options.width,
			msg.options.height,
			resolvePlayers(msg.options.players),
			msg.options.runs,
			msg.options.controlBuffer,
			msg.options.tallyBuffer,
		);
		reply({ type: "sharedBuffer:end", result: [...result] });
		return;
	}

	// Batch strategy

	function runBatch() {
		if (state.runsPerBatch === 0 || state.gameId >= state.options.runs) {
			reply({ type: "incremental:end", result: state.tally });
			return;
		}

		const { width, height, players } = state.options;
		const runs = Math.min(
			state.runsPerBatch,
			state.options.runs - state.gameId,
		);

		const result = mod.run(width, height, resolvePlayers(players), runs);
		result.forEach((score, i) => (state.tally[i] += score));
		state.gameId += runs;

		reply({
			type: "incremental:batch",
			gameId: state.gameId,
			tally: state.tally,
		});
	}

	if (msg.type === "incremental:start") {
		state.tally = array(msg.options.players.length, () => 0);
		state.options = msg.options;
		state.gameId = 0;

		// Calculate roughly how many games should be played in each
		// batch to satisfy the provided refreshMs.
		const beginSingle = Date.now();
		mod.run(
			msg.options.width,
			msg.options.height,
			resolvePlayers(msg.options.players),
			1,
		);
		const duration = Date.now() - beginSingle;
		state.runsPerBatch = Math.floor(msg.refreshMs / duration);

		runBatch();
	}

	if (msg.type === "incremental:cancel") {
		reply({ type: "incremental:end", result: state.tally });
		return;
	}

	if (msg.type === "incremental:continue") {
		runBatch();
		return;
	}
});
