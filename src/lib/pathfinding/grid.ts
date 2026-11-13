/** Array access that trusts the caller's bounds, keeping indexing checks out of hot loops. */
export function at<T>(array: readonly T[], index: number): T {
	return array[index] as T;
}

/** A width x height grid backed by a flat array. */
export class Grid<T> {
	readonly cells: T[];

	constructor(
		readonly width: number,
		readonly height: number,
		fill: T | ((x: number, y: number) => T),
	) {
		this.cells = Array.from({ length: width * height }, (_, i) => {
			const x = i % width;
			const y = Math.floor(i / width);
			return typeof fill === "function"
				? (fill as (x: number, y: number) => T)(x, y)
				: fill;
		});
	}

	inBounds(x: number, y: number) {
		return x >= 0 && x < this.width && y >= 0 && y < this.height;
	}

	get(x: number, y: number): T {
		return at(this.cells, y * this.width + x);
	}

	set(x: number, y: number, value: T) {
		this.cells[y * this.width + x] = value;
	}
}
