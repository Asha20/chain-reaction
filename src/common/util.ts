export function assert(
	condition: unknown,
	message?: string,
): asserts condition {
	if (!condition) {
		throw new Error(message ?? "Assertion failed.");
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function noop(): void {}

export function array<T>(length: number, fn: (_index: number) => T): T[] {
	return Array.from({ length }, (_, i) => fn(i));
}

export function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function waitForEvent<
	E extends HTMLElement,
	K extends keyof HTMLElementEventMap
>(element: E, type: K): Promise<HTMLElementEventMap[K]> {
	return new Promise<HTMLElementEventMap[K]>(resolve => {
		element.addEventListener(type, resolve, { once: true });
	});
}

/** Creates a seeded RNG. */
export function mulberry32(seed: number): () => number {
	let a = seed;

	return function random() {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
export const random = mulberry32(seed);

type Fn<TArgs extends unknown[], TReturn = void> = (...args: TArgs) => TReturn;
export function debounce<TArgs extends unknown[]>(
	ms: number,
	callback: Fn<TArgs>,
): Fn<TArgs> {
	let intervalId = 0;
	return function _debounce(...args) {
		clearTimeout(intervalId);
		intervalId = setTimeout(callback, ms, ...args);
	};
}

export interface CancelPromise {
	promise: Promise<void>;
	cancelled: boolean;
	cancel(): void;
}

export function CancelPromise(): CancelPromise {
	let cancel = noop;
	let _cancelled = false;

	const promise = new Promise<void>(resolve => {
		cancel = () => {
			resolve();
			_cancelled = true;
		};
	});

	assert(cancel !== noop);
	return {
		promise,
		cancel,
		get cancelled() {
			return _cancelled;
		},
	};
}
