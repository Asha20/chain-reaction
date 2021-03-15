export function array<T>(length: number, fn: (_index: number) => T): T[] {
	return Array.from({ length }, (_, i) => fn(i));
}

/** Given a length n, creates an array `[0, 1, 2, ..., n - 1]`. */
export function countingArray(length: number): number[] {
	return Array.from({ length }, (_, i) => i);
}
