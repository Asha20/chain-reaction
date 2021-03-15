/** Given a length n, creates an array `[0, 1, 2, ..., n - 1]`. */
export function countingArray(length: number): number[] {
	return Array.from({ length }, (_, i) => i);
}
