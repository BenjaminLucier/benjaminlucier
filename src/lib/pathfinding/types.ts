export type CellState = "idle" | "wall" | "start" | "end" | "search" | "path";

export type Point = { x: number; y: number };

export type SearchStep =
	| { type: "visit"; x: number; y: number; from: Point | null }
	| { type: "found"; path: Point[] }
	| { type: "failed" };

export type PathAlgorithm = "astar" | "dijkstra" | "bfs" | "dfs";

export type MazeAlgorithm = "recursiveDivision" | "random";

/**
 * Algorithm-independent cost counters, filled in by the search as it runs.
 * - ops: one per neighbour examined, per frontier push or pop, and per heap comparison.
 * - peakFrontier: the most nodes ever waiting in the queue, stack or heap at once.
 */
export type SearchMetrics = { ops: number; peakFrontier: number };

export type IsWall = (x: number, y: number) => boolean;

export type SearchFn = (
	width: number,
	height: number,
	start: Point,
	end: Point,
	isWall: IsWall,
	metrics: SearchMetrics,
) => Generator<SearchStep, void, void>;

/** Returns wall cells in the order they should be revealed. */
export type MazeFn = (
	width: number,
	height: number,
	rng?: () => number,
) => Point[];
