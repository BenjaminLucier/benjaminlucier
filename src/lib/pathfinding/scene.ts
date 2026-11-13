import { mulberry32 } from "~/lib/rng";
import {
	fitGrid,
	type GridOptions,
	type SceneSize,
} from "~/lib/thumbnail-scene";
import { mazeAlgorithms, pathAlgorithms } from "./catalog";
import { GraphRenderer } from "./graphView";
import { GraphLayout } from "./layout";
import { currentPalette } from "./palette";
import { createMetrics } from "./search";
import type { CellState, MazeAlgorithm, PathAlgorithm, Point } from "./types";

export type PathfindingSceneOptions = GridOptions & {
	seed?: number;
	algorithm?: PathAlgorithm;
	maze?: MazeAlgorithm;
	/** How much of the search to show, from 0 (just started) to 1 (finished, path drawn). */
	progress?: number;
	/** How much of the solved path to draw, from its start, from 0 to 1. Defaults to all of it once the search is finished, else none. */
	pathShown?: number;
};

/** Layout ticks run before drawing, enough for the force layout to settle. */
const LAYOUT_TICKS = 300;
const FOREVER = 1e9;

/**
 * A maze mid-search drawn as a graph: a node per open cell, the search tree growing out of
 * the start, and the solved path. The maze has an odd number of columns and rows, sized
 * to the stage by `cell`, `cols` and `rows`; the graph is centred in what's left.
 */
export function drawPathfindingScene(
	ctx: CanvasRenderingContext2D,
	size: SceneSize,
	{
		seed = 1,
		algorithm = "astar",
		maze = "recursiveDivision",
		progress = 1,
		pathShown = progress >= 1 ? 1 : 0,
		...gridOptions
	}: PathfindingSceneOptions,
) {
	const rng = mulberry32(seed);
	const grid = fitGrid(size, gridOptions, 20, { odd: true });
	const { cols, rows, cell: pitch } = grid;
	const total = cols * rows;
	const idx = (x: number, y: number) => y * cols + x;

	const states: CellState[] = new Array(total).fill("idle");
	for (const { x, y } of mazeAlgorithms[maze].fn(cols, rows, rng)) {
		states[idx(x, y)] = "wall";
	}

	// Start low on the left and end high on the right, on open cells, so the search has to
	// cross most of the maze.
	const open = (x1: number, x2: number, y1: number, y2: number) => {
		for (;;) {
			const x = x1 + Math.floor(rng() * (x2 - x1));
			const y = y1 + Math.floor(rng() * (y2 - y1));
			if (states[idx(x, y)] !== "wall") return { x, y };
		}
	};
	const third = (n: number) => Math.floor(n / 3);
	const start = open(0, third(cols), rows - third(rows), rows);
	const end = open(cols - third(cols), cols, 0, third(rows));
	states[idx(start.x, start.y)] = "start";
	states[idx(end.x, end.y)] = "end";

	const parents = new Int32Array(total).fill(-1);
	const isWall = (x: number, y: number) => states[idx(x, y)] === "wall";
	const isEndpoint = (x: number, y: number) =>
		(x === start.x && y === start.y) || (x === end.x && y === end.y);
	const search = () =>
		pathAlgorithms[algorithm].fn(
			cols,
			rows,
			start,
			end,
			isWall,
			createMetrics(),
		);
	const steps = [...search()];
	// Show only this share of the cells the full search visits.
	const visitLimit = Math.floor(
		steps.filter((step) => step.type === "visit").length * progress,
	);
	let visited = 0;
	for (const step of steps) {
		if (step.type !== "visit" || visited >= visitLimit) continue;
		visited++;
		if (step.from) parents[idx(step.x, step.y)] = idx(step.from.x, step.from.y);
		if (!isEndpoint(step.x, step.y)) states[idx(step.x, step.y)] = "search";
	}
	// The solved path, from the start, as far as asked for. It's drawn even where the
	// search hasn't reached yet, so a half-finished search can still show its route.
	const solved = steps.find((step) => step.type === "found");
	if (solved?.type === "found") {
		const inner = solved.path.slice(1, -1);
		for (let i = 0; i < Math.floor(inner.length * pathShown); i++) {
			const at = inner[i] as Point;
			const before = solved.path[i] as Point;
			states[idx(at.x, at.y)] = "path";
			parents[idx(at.x, at.y)] = idx(before.x, before.y);
		}
	}

	const layout = new GraphLayout(cols, rows, pitch, rng);
	layout.sync(states);
	for (let i = 0; i < LAYOUT_TICKS && layout.step(); i++);

	const palette = currentPalette();
	// Everything changed long ago, so no cell is still animating in.
	const changedAt = new Float64Array(total).fill(-FOREVER);
	// The renderer sizes its own canvas to the maze; draw there, then place it in the stage.
	const canvas = document.createElement("canvas");
	new GraphRenderer().draw(canvas, {
		cols,
		rows,
		pitch,
		states,
		xs: layout.xs,
		ys: layout.ys,
		parents,
		changedAt,
		appearedAt: changedAt,
		now: 0,
		palette,
		highlight: null,
	});
	ctx.fillStyle = palette.background;
	ctx.fillRect(0, 0, size.width, size.height);
	ctx.drawImage(canvas, grid.x, grid.y, cols * pitch, rows * pitch);
}
