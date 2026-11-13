import {
	ANIM_MS,
	keyframes,
	mix,
	type Palette,
	type PaletteColors,
} from "./palette";
import type { CellState, Point } from "./types";

export type GridModel = {
	cols: number;
	rows: number;
	pitch: number;
	states: readonly CellState[];
	/** performance.now() of each cell's last state change, for animation. */
	changedAt: Float64Array;
	now: number;
	palette: Palette;
	showGrid: boolean;
	highlight: (Point & { kind: "start" | "end" }) | null;
};

const BATCHED: CellState[] = ["wall", "start", "end", "search", "path"];

/**
 * Draws the board as a square per cell. Open cells are the background fill; every other
 * colour is one batched path. Only cells mid-animation are drawn individually.
 */
export class GridRenderer {
	/** Draws one frame. Returns true while anything is mid-animation and another frame is needed. */
	draw(canvas: HTMLCanvasElement, m: GridModel): boolean {
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
		ctx.fillStyle = pal.idle;
		ctx.fillRect(0, 0, width, height);

		const p = m.pitch;
		const paths = Object.fromEntries(
			BATCHED.map((k) => [k, new Path2D()]),
		) as Record<CellState, Path2D>;
		const animated: number[] = [];
		for (let i = 0; i < m.cols * m.rows; i++) {
			const state = m.states[i] ?? "idle";
			if (state === "idle") continue;
			const animates =
				state === "wall" || state === "search" || state === "path";
			if (animates && m.now - (m.changedAt[i] ?? 0) < ANIM_MS) {
				animated.push(i);
				continue;
			}
			paths[state].rect((i % m.cols) * p, Math.floor(i / m.cols) * p, p, p);
		}
		for (const kind of BATCHED) {
			ctx.fillStyle = pal[kind as keyof PaletteColors];
			ctx.fill(paths[kind]);
		}

		let animating = false;
		for (const i of animated) {
			const state = m.states[i] as CellState;
			const t = Math.min((m.now - (m.changedAt[i] ?? 0)) / ANIM_MS, 1);
			let scale = keyframes(t, 0, 1.25, 1);
			if (state === "wall") {
				ctx.fillStyle = pal.wall;
			} else if (state === "search") {
				ctx.fillStyle = mix(pal.rgb.idle, pal.rgb.search, t);
			} else {
				scale = keyframes(t, 1, 1.5, 1);
				ctx.fillStyle = mix(pal.rgb.search, pal.rgb.path, t);
			}
			const size = p * scale;
			const cx = ((i % m.cols) + 0.5) * p;
			const cy = (Math.floor(i / m.cols) + 0.5) * p;
			ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
			animating = true;
		}

		if (m.showGrid) {
			const lines = new Path2D();
			for (let x = 0; x <= m.cols; x++) {
				lines.moveTo(x * p + 0.5, 0);
				lines.lineTo(x * p + 0.5, height);
			}
			for (let y = 0; y <= m.rows; y++) {
				lines.moveTo(0, y * p + 0.5);
				lines.lineTo(width, y * p + 0.5);
			}
			ctx.lineWidth = 1;
			ctx.strokeStyle = pal.gridLine;
			ctx.stroke(lines);
		}

		if (m.highlight) {
			ctx.fillStyle =
				m.highlight.kind === "start" ? pal.dragStart : pal.dragEnd;
			ctx.fillRect(m.highlight.x * p, m.highlight.y * p, p, p);
		}
		return animating;
	}
}
