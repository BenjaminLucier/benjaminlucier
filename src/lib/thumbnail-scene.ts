/** Size of the thumbnail stage a scene draws into, in pixels. */
export type SceneSize = { width: number; height: number };

/**
 * How big a grid's cells are and how many there are. Give a `cell` size, or `cols` and/or
 * `rows` and the cell is sized to fit; a missing count is whatever fits the stage.
 */
export type GridOptions = {
	/** Side of one cell in pixels. */
	cell?: number;
	cols?: number;
	rows?: number;
};

/** A grid sized to the stage, with the offset that centres it. */
export type FittedGrid = {
	cols: number;
	rows: number;
	cell: number;
	x: number;
	y: number;
};

/**
 * Works out a grid for the stage: its cell size, its dimensions and where it starts so it
 * sits in the middle. `odd` rounds both dimensions down to odd numbers, as mazes need.
 */
export function fitGrid(
	size: SceneSize,
	{ cell, cols, rows }: GridOptions,
	fallbackCell: number,
	{ odd = false } = {},
): FittedGrid {
	const round = (n: number) => Math.max(odd && n % 2 === 0 ? n - 1 : n, 1);
	let side = cell;
	if (side === undefined) {
		const fits = [
			cols === undefined ? Infinity : size.width / round(cols),
			rows === undefined ? Infinity : size.height / round(rows),
		];
		side = Math.min(...fits);
		if (!Number.isFinite(side)) side = fallbackCell;
	}
	const fittedCols = round(cols ?? Math.floor(size.width / side));
	const fittedRows = round(rows ?? Math.floor(size.height / side));
	return {
		cols: fittedCols,
		rows: fittedRows,
		cell: side,
		x: (size.width - fittedCols * side) / 2,
		y: (size.height - fittedRows * side) / 2,
	};
}

/** How big a continuous board is in the stage: `scale` pixels to each board unit. */
export type ScaleOptions = { scale?: number };

/** The board's size in its own units, and scales the context so they fill the stage. */
export function scaleBoard(
	ctx: CanvasRenderingContext2D,
	size: SceneSize,
	{ scale = 1 }: ScaleOptions,
): SceneSize {
	ctx.scale(scale, scale);
	return {
		width: Math.floor(size.width / scale),
		height: Math.floor(size.height / scale),
	};
}
