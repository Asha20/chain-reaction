import { CancelPromise } from "@common/util";

const worker = new Worker(new URL("./worker", import.meta.url));

interface RunOptions {
	width: number;
	height: number;
	runs: number;
	players: number;
}

export interface RunMessage extends RunOptions {
	controlBuffer: ArrayBuffer;
	tallyBuffer: ArrayBuffer;
}

type WasmTally = number[];

/**
 * SharedArrayBuffer browser support isn't the best,
 * so when it's unavailable use a regular ArrayBuffer.
 */
function createSharedBuffer(bytes: number) {
	if (typeof SharedArrayBuffer === "function") {
		return new SharedArrayBuffer(bytes);
	}

	return new ArrayBuffer(bytes);
}

export function run(
	options: RunOptions,
	refreshMs: number,
	updateCallback: (id: number, tally: number[]) => void,
): CancelPromise<WasmTally> {
	const tallyBuffer = createSharedBuffer(4 * options.players);
	/**
	 * The first u32 of the buffer contains the current game id.
	 * The second u32 of the buffer contains a cancellation flag.
	 * This flag is non-zero if the WASM code should be cancelled.
	 */
	const controlBuffer = createSharedBuffer(8);

	const message: RunMessage = { ...options, controlBuffer, tallyBuffer };
	worker.postMessage(message);

	const tally = new Uint32Array(tallyBuffer);
	const control = new Uint32Array(controlBuffer);

	const executeCallback = () => updateCallback(control[0], [...tally]);
	const intervalId = setInterval(executeCallback, refreshMs);

	const promise = new Promise<WasmTally>(resolve => {
		worker.addEventListener(
			"message",
			e => {
				clearInterval(intervalId);
				executeCallback();
				resolve(e.data);
			},
			{ once: true },
		);
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
