export function array<T>(length: number, fn: (_index: number) => T): T[] {
	return Array.from({ length }, (_, i) => fn(i));
}

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
