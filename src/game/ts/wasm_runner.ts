import { CancelPromise, noop } from "@common/util";

export interface RunOptions {
	width: number;
	height: number;
	runs: number;
	players: number;
}

export interface RunWithSharedBufferOptions extends RunOptions {
	controlBuffer: SharedArrayBuffer;
	tallyBuffer: SharedArrayBuffer;
}

export type RunMessage =
	| { type: "sharedBuffer:start"; options: RunWithSharedBufferOptions }
	| { type: "incremental:start"; refreshMs: number; options: RunOptions }
	| { type: "incremental:continue" }
	| { type: "incremental:cancel" };

export type WorkerMessage =
	| { type: "sharedBuffer:end"; result: WasmTally }
	| { type: "incremental:batch"; gameId: number; tally: WasmTally }
	| { type: "incremental:end"; result: WasmTally };

type WasmTally = number[];

const worker = new Worker(new URL("./worker", import.meta.url));

function sendMessage(msg: RunMessage) {
	worker.postMessage(msg);
}

function onMessage(onMsg: (msg: WorkerMessage) => void, once = false) {
	const handler = (e: MessageEvent<WorkerMessage>) => onMsg(e.data);

	worker.addEventListener("message", handler, { once });
	return () => worker.removeEventListener("message", handler);
}

/**
 * Run using SharedArrayBuffers to communicate between the
 * main thread and WASM. Since WASM can interact with the
 * shared buffers directly and doesn't need to stop its
 * execution in order to communicate with the JS environment,
 * this is presumably rather fast.
 */
function runWithSharedBuffer(
	options: RunOptions,
	refreshMs: number,
	updateCallback: (id: number, tally: number[]) => void,
): CancelPromise<WasmTally> {
	const tallyBuffer = new SharedArrayBuffer(4 * options.players);
	/**
	 * The first u32 of the buffer contains the current game id.
	 * The second u32 of the buffer contains a cancellation flag.
	 * This flag is non-zero if the WASM code should be cancelled.
	 */
	const controlBuffer = new SharedArrayBuffer(8);

	const tally = new Uint32Array(tallyBuffer);
	const control = new Uint32Array(controlBuffer);
	const executeCallback = () => updateCallback(control[0], [...tally]);

	const message: RunMessage = {
		type: "sharedBuffer:start",
		options: { ...options, controlBuffer, tallyBuffer },
	};

	sendMessage(message);
	const intervalId = setInterval(executeCallback, refreshMs);

	const promise = new Promise<WasmTally>(resolve => {
		onMessage(msg => {
			if (msg.type === "sharedBuffer:end") {
				clearInterval(intervalId);
				executeCallback();
				resolve(msg.result);
			}
		}, true);
	});

	let _cancelled = false;

	function cancel() {
		_cancelled = true;
		control[1] = 1;
	}

	return {
		promise,
		cancel,
		get cancelled() {
			return _cancelled;
		},
	};
}

/**
 * SharedArrayBuffer browser support isn't the best,
 * so when it's unavailable use a fallback that relies
 * on splitting the runs into batches.
 *
 * @param options Game settings and number of runs
 * @param refreshMs How often the `updateCallback` should be called
 * @param updateCallback Provides the number of completed runs and the tally so far
 */
export function run(
	options: RunOptions,
	refreshMs: number,
	updateCallback: (id: number, tally: number[]) => void,
): CancelPromise<WasmTally> {
	return typeof SharedArrayBuffer === "function"
		? runWithSharedBuffer(options, refreshMs, updateCallback)
		: runInBatches(options, refreshMs, updateCallback);
}

/**
 * Splits the run into batches and sends data to the main
 * thread after each batch. Batches serve to reduce the
 * number of times the WASM code gets interrupted in order
 * to communicate with the JS environment, while still being
 * small enough to allow responding to cancellation request
 * from the user.
 *
 * Since this implementation interrupts the WASM code in
 * order to communicate with the main thread, it is presumably
 * slower than using SharedArrayBuffers.
 *
 * The main thread sends an `increment:start` message.
 * This prompts the WebWorker to run the first batch.
 * The WebWorker sends the results back to the main thread
 * via `increment:batch` messages. Every batch after the
 * first one requires an `incremental:continue` message
 * from the main thread in order to continue executing.
 * This gives the WebWorker a chance to be free to respond
 * to other incoming messages such as `incremental:cancel`.
 *
 * Once either all of the batches are finished or the
 * WebWorker receives a cancel request, it emits an
 * `incremental:end` message with the final tally.
 *
 * @returns Promise that resolves on `incremental:end`
 */
function runInBatches(
	options: RunOptions,
	refreshMs: number,
	updateCallback: (gameId: number, tally: number[]) => void,
): CancelPromise<WasmTally> {
	let _cancelled = false;

	const unsubscribeStep = onMessage(msg => {
		if (msg.type === "incremental:batch") {
			updateCallback(msg.gameId, msg.tally);

			if (!_cancelled) {
				sendMessage({ type: "incremental:continue" });
			}
		}
	});

	const promise = new Promise<WasmTally>(resolve => {
		// For some reason, adding {once: true} to this event handler
		// makes it not get called at all, so unsubscribe manually instead.
		let unsubscribe = noop;
		unsubscribe = onMessage(msg => {
			if (msg.type === "incremental:end") {
				unsubscribeStep();
				unsubscribe();
				resolve(msg.result);
			}
		});
	});

	const message: RunMessage = { type: "incremental:start", refreshMs, options };
	sendMessage(message);

	function cancel() {
		_cancelled = true;
		sendMessage({ type: "incremental:cancel" });
	}

	return {
		promise,
		cancel,
		get cancelled() {
			return _cancelled;
		},
	};
}
