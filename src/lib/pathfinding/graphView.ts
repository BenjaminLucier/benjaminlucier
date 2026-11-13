import {
	ANIM_MS,
	keyframes,
	mix,
	type Palette,
	type PaletteColors,
	TAU,
} from "./palette";
import type { CellState, Point } from "./types";

export type GraphModel = {
	cols: number;
	rows: number;
	/** Spacing of the original grid; sets node sizes and the canvas size. */
	pitch: number;
	states: readonly CellState[];
	/** Layout positions per cell index, NaN for cells that are not in the graph (walls). */
	xs: Float64Array;
	ys: Float64Array;
	/** For each node, the index of the node that discovered it, or -1. */
	parents: Int32Array;
	/** performance.now() of each node's last state change, for animation. */
	changedAt: Float64Array;
	/** performance.now() of when each node rejoined the graph after being a wall. */
	appearedAt: Float64Array;
	now: number;
	palette: Palette;
	highlight: (Point & { kind: "start" | "end" }) | null;
};

const NODE_KINDS: CellState[] = ["idle", "search", "path", "start", "end"];

/**
 * Draws the open cells as a graph: a node per cell and an edge between every pair of open
 * neighbours. Walls are absent. Positions come from a layout, not from the grid.
 *
 * Everything is batched: each layer (edges, tree, path, each node colour) is a single path
 * that is filled or stroked once. Only nodes and edges mid-animation are drawn separately.
 */
export class GraphRenderer {
	/** Draws one frame. Returns true while anything is mid-animation and another frame is needed. */
	draw(canvas: HTMLCanvasElement, m: GraphModel): boolean {
		const dpr = window.devicePixelRatio || 1;
		const width = m.cols * m.pitch;
		const height = m.rows * m.pitch;
		const pxW = Math.round(width * dpr);
		const pxH = Math.round(height * dpr);
		if (canvas.width !== pxW || canvas.height !== pxH) {
			canvas.width = pxW;
			canvas.height = pxH;
		}
		const ctx = canvas.getContext("2d");
		if (!ctx) return false;
		const pal = m.palette;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.fillStyle = pal.background;
		ctx.fillRect(0, 0, width, height);

		const total = m.cols * m.rows;
		const inGraph = (i: number) => m.states[i] !== "wall";
		const age = (i: number) => m.now - (m.changedAt[i] ?? 0);
		const progress = (i: number) => Math.min(Math.max(age(i) / ANIM_MS, 0), 1);
		const x = (i: number) => m.xs[i] as number;
		const y = (i: number) => m.ys[i] as number;
		let animating = false;

		// Layer 1: every possible move between open neighbours.
		const edges = new Path2D();
		for (let i = 0; i < total; i++) {
			if (!inGraph(i)) continue;
			if ((i % m.cols) + 1 < m.cols && inGraph(i + 1)) {
				edges.moveTo(x(i), y(i));
				edges.lineTo(x(i + 1), y(i + 1));
			}
			if (i + m.cols < total && inGraph(i + m.cols)) {
				edges.moveTo(x(i), y(i));
				edges.lineTo(x(i + m.cols), y(i + m.cols));
			}
		}
		ctx.lineCap = "round";
		ctx.lineWidth = 1;
		ctx.strokeStyle = pal.edge;
		ctx.stroke(edges);

		// Layers 2 and 3: the search tree (who discovered whom) and the final path.
		// Edges still growing in are drawn partway along their length.
		const tree = new Path2D();
		const route = new Path2D();
		const segment = (target: Path2D, from: number, to: number, t: number) => {
			target.moveTo(x(from), y(from));
			target.lineTo(
				x(from) + (x(to) - x(from)) * t,
				y(from) + (y(to) - y(from)) * t,
			);
		};
		for (let i = 0; i < m.parents.length; i++) {
			const p = m.parents[i] as number;
			if (p < 0 || !inGraph(i) || !inGraph(p)) continue;
			const s = m.states[i];
			const ps = m.states[p];
			const treeT = s === "search" ? progress(i) : 1;
			segment(tree, p, i, treeT);
			if ((s === "path" || s === "end") && (ps === "path" || ps === "start")) {
				// The end node never animates itself; its edge follows the last path node in.
				const routeT =
					s === "path" ? progress(i) : ps === "path" ? progress(p) : 1;
				segment(route, p, i, routeT);
				if (routeT < 1) animating = true;
			}
			if (treeT < 1) animating = true;
		}
		ctx.lineWidth = 1.5;
		ctx.strokeStyle = pal.tree;
		ctx.stroke(tree);
		ctx.lineWidth = 3;
		ctx.strokeStyle = pal.pathEdge;
		ctx.stroke(route);

		// Layer 4: nodes, one path per colour. Nodes mid-animation are drawn individually.
		const paths = Object.fromEntries(
			NODE_KINDS.map((k) => [k, new Path2D()]),
		) as Record<CellState, Path2D>;
		const small = m.pitch * 0.3;
		const large = m.pitch * 0.42;
		const animated: number[] = [];
		for (let i = 0; i < total; i++) {
			const state = m.states[i] ?? "idle";
			if (state === "wall") continue;
			const reappearing =
				state === "idle" && m.now - (m.appearedAt[i] ?? 0) < ANIM_MS;
			if (
				reappearing ||
				((state === "search" || state === "path") && age(i) < ANIM_MS)
			) {
				animated.push(i);
				continue;
			}
			const r = state === "start" || state === "end" ? large : small;
			paths[state].moveTo(x(i) + r, y(i));
			paths[state].arc(x(i), y(i), r, 0, TAU);
		}
		for (const kind of NODE_KINDS) {
			ctx.fillStyle = pal[kind as keyof PaletteColors];
			ctx.fill(paths[kind]);
		}
		for (const i of animated) {
			const state = m.states[i] as CellState;
			let t = progress(i);
			let scale: number;
			if (state === "search") {
				scale = keyframes(t, 0, 1.25, 1);
				ctx.fillStyle = mix(pal.rgb.idle, pal.rgb.search, t);
			} else if (state === "path") {
				scale = keyframes(t, 1, 1.5, 1);
				ctx.fillStyle = mix(pal.rgb.search, pal.rgb.path, t);
			} else {
				t = Math.min((m.now - (m.appearedAt[i] ?? 0)) / ANIM_MS, 1);
				scale = keyframes(t, 0, 1.25, 1);
				ctx.fillStyle = pal.idle;
			}
			ctx.beginPath();
			ctx.arc(x(i), y(i), small * scale, 0, TAU);
			ctx.fill();
			animating = true;
		}

		if (m.highlight) {
			const i = m.highlight.y * m.cols + m.highlight.x;
			if (inGraph(i)) {
				ctx.fillStyle =
					m.highlight.kind === "start" ? pal.dragStart : pal.dragEnd;
				ctx.beginPath();
				ctx.arc(x(i), y(i), large, 0, TAU);
				ctx.fill();
			}
		}
		return animating;
	}
}
