import { Grid } from "./grid";
import type { Point } from "./types";

/** Source of randomness in [0, 1); injectable so a maze can be made repeatable. */
export type Rng = () => number;

/** Fisher-Yates shuffle, in place. */
function shuffle<T>(items: T[], rng: Rng): T[] {
	for (let i = items.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[items[i], items[j]] = [items[j] as T, items[i] as T];
	}
	return items;
}

/** Scatters walls at random; roughly `density` of the cells become walls, in random order. */
export function randomMazeWalls(
	width: number,
	height: number,
	density = 0.3,
	rng: Rng = Math.random,
): Point[] {
	const walls: Point[] = [];
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (rng() < density) walls.push({ x, y });
		}
	}
	return shuffle(walls, rng);
}

/** Random integer in [low, high]; with `odd`, only odd values are returned (the range must allow one). */
function randomInclusive(
	low: number,
	high: number,
	odd: boolean,
	rng: Rng,
): number {
	for (;;) {
		const value = low + Math.floor(rng() * (high - low + 1));
		if (!odd || value % 2 !== 0) return value;
	}
}

type Chamber = { x1: number; y1: number; x2: number; y2: number };

/**
 * Recursively splits the grid with walls that each have one gap, giving a solvable maze.
 * Walls are returned in the order they should appear: the border first, then every
 * division one recursion level at a time, so the maze fills in from the outside inward.
 */
export function recursiveDivisionWalls(
	width: number,
	height: number,
	rng: Rng = Math.random,
): Point[] {
	const grid = new Grid(
		width,
		height,
		(x, y) => y === 0 || x === 0 || y === height - 1 || x === width - 1,
	);
	const order: Point[] = [];
	for (let x = 0; x < width; x++) order.push({ x, y: 0 });
	for (let y = 1; y < height; y++) order.push({ x: width - 1, y });
	for (let x = width - 2; x >= 0; x--) order.push({ x, y: height - 1 });
	for (let y = height - 2; y >= 1; y--) order.push({ x: 0, y });

	// Breadth-first, so all chambers at one depth are divided before any deeper ones.
	const queue: Chamber[] = [{ x1: 1, y1: 1, x2: width - 2, y2: height - 2 }];
	for (let head = 0; head < queue.length; head++) {
		const { x1, y1, x2, y2 } = queue[head] as Chamber;
		if (x2 - x1 < 2 || y2 - y1 < 2) continue;

		if (x2 - x1 <= y2 - y1) {
			const wallY = randomInclusive(y1 + 1, y2 - 1, true, rng);
			for (let x = x1; x <= x2; x++) grid.set(x, wallY, true);

			const leftIsWall = grid.get(x1 - 1, wallY);
			const rightIsWall = grid.get(x2 + 1, wallY);
			let gapX: number;
			if (leftIsWall && rightIsWall) gapX = rng() > 0.5 ? x1 : x2;
			else if (leftIsWall) gapX = x1;
			else if (rightIsWall) gapX = x2;
			else gapX = randomInclusive(x1, x2, false, rng);
			grid.set(gapX, wallY, false);

			for (let x = x1; x <= x2; x++)
				if (x !== gapX) order.push({ x, y: wallY });
			queue.push({ x1, y1, x2, y2: wallY - 1 }, { x1, y1: wallY + 1, x2, y2 });
		} else {
			const wallX = randomInclusive(x1 + 1, x2 - 1, true, rng);
			for (let y = y1; y <= y2; y++) grid.set(wallX, y, true);

			const topIsWall = grid.get(wallX, y1 - 1);
			const bottomIsWall = grid.get(wallX, y2 + 1);
			let gapY: number;
			if (topIsWall && bottomIsWall) gapY = rng() > 0.5 ? y1 : y2;
			else if (topIsWall) gapY = y1;
			else if (bottomIsWall) gapY = y2;
			else gapY = randomInclusive(y1, y2, false, rng);
			grid.set(wallX, gapY, false);

			for (let y = y1; y <= y2; y++)
				if (y !== gapY) order.push({ x: wallX, y });
			queue.push({ x1, y1, x2: wallX - 1, y2 }, { x1: wallX + 1, y1, x2, y2 });
		}
	}
	return order;
}
