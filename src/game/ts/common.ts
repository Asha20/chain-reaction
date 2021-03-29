export interface XY {
	x: number;
	y: number;
}

/** Given a length n, creates an array `[0, 1, 2, ..., n - 1]`. */
export function countingArray(length: number): number[] {
	return Array.from({ length }, (_, i) => i);
}

export function neighbors(
	pos: number,
	width: number,
	height: number,
): number[] {
	const offsets = ({ x, y }: XY): XY[] => [
		{ x: x - 1, y },
		{ x: x + 1, y },
		{ x, y: y - 1 },
		{ x, y: y + 1 },
	];

	const getXY = (pos: number): XY => ({
		x: pos % width,
		y: Math.floor(pos / width),
	});

	const getPos = ({ x, y }: XY) => y * width + x;

	const inBounds = ({ x, y }: XY) =>
		x >= 0 && x < width && y >= 0 && y < height;

	return offsets(getXY(pos)).filter(inBounds).map(getPos);
}
