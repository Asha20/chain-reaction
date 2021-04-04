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
	return ms <= 0
		? Promise.resolve()
		: new Promise(resolve => setTimeout(resolve, ms));
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

export function throttle<TArgs extends unknown[]>(
	limit: number,
	callback: Fn<TArgs>,
): Fn<TArgs> {
	let waiting = false;
	return function (...args) {
		if (!waiting) {
			callback(...args);
			waiting = true;
			setTimeout(() => {
				waiting = false;
			}, limit);
		}
	};
}

export interface CancelPromise<T = void> {
	promise: Promise<T>;
	cancelled: boolean;
	cancel(): void;
}

/**
 * Returns a promise and a cancel function. The promise resolves
 * once the cancel function is called.
 */
export function CancelPromise<T>(): CancelPromise<T>;
export function CancelPromise<T>(from: Promise<T>): CancelPromise<T>;
export function CancelPromise<T = void>(
	from?: Promise<T>,
): CancelPromise<T | void> {
	let cancel = noop;
	let _cancelled = false;

	const promise =
		from ??
		new Promise<void>(resolve => {
			cancel = () => {
				resolve();
				_cancelled = true;
			};
		});

	if (from) {
		cancel = () => (_cancelled = true);
	}

	assert(cancel !== noop);
	return {
		promise,
		cancel,
		get cancelled() {
			return _cancelled;
		},
	};
}

/**
 * Returns a promise and a cancel function. Once the cancel function
 * is called, the promise is resolved and the promise and the cancellation
 * function are replaced with a fresh pair. Getters are used to make the
 * replacing part invisible to the end user.
 */
export function RepeatablePromise(): Omit<CancelPromise, "cancelled"> {
	let _cancel = noop;

	const repeatingPromise = () =>
		new Promise<void>(resolve => {
			_cancel = resolve;
		}).then(() => {
			_promise = repeatingPromise();
		});

	let _promise = repeatingPromise();

	assert(_cancel !== noop);
	return {
		get promise() {
			return _promise;
		},
		get cancel() {
			return _cancel;
		},
	};
}
