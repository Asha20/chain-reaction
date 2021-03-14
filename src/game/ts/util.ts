export function array<T>(length: number, fn: (_index: number) => T): T[] {
	return Array.from({ length }, (_, i) => fn(i));
}

/** Given a length n, creates an array `[0, 1, 2, ..., n - 1]`. */
export function countingArray(length: number): number[] {
	return Array.from({ length }, (_, i) => i);
}

export function assert(
	condition: unknown,
	message?: string,
): asserts condition {
	if (!condition) {
		throw new Error(message ?? "Assertion failed.");
	}
}

export function restrict(min: number, max: number): (x: number) => number {
	return function _restrict(value: number) {
		const boundHigh = Math.min(value, max);
		return Math.max(boundHigh, min);
	};
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
