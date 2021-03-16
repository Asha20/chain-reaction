const worker = new Worker(new URL("./worker", import.meta.url));

export interface RunMessage {
	width: number;
	height: number;
	runs: number;
	players: number;
}

type WasmTally = number[];

export function run(options: RunMessage): Promise<WasmTally> {
	worker.postMessage(options);

	return new Promise(resolve => {
		worker.addEventListener("message", e => resolve(e.data as WasmTally), {
			once: true,
		});
	});
}

export function terminate(): void {
	worker.terminate();
}

export function active(): boolean {
	return worker !== null;
}
