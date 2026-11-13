import {
	forceLink,
	forceManyBody,
	forceSimulation,
	forceX,
	forceY,
	type Simulation,
	type SimulationLinkDatum,
	type SimulationNodeDatum,
} from "d3-force";
import type { CellState } from "./types";

/** Source of randomness in [0, 1); injectable so a layout can be made repeatable. */
export type Rng = () => number;

type LayoutNode = SimulationNodeDatum & { id: number };
type LayoutLink = SimulationLinkDatum<LayoutNode>;

/**
 * Force-directed layout of the open cells. Walls are not part of the graph: they get no node
 * and no edges. Nodes start on their grid positions so the layout relaxes out of the maze
 * shape instead of appearing from nowhere, and surviving nodes keep their positions when
 * the board changes.
 *
 * Positions are indexed by cell (y * cols + x); removed cells are NaN.
 */
export class GraphLayout {
	readonly xs: Float64Array;
	readonly ys: Float64Array;
	private byCell: (LayoutNode | undefined)[];
	private readonly simulation: Simulation<LayoutNode, LayoutLink>;
	private readonly links = forceLink<LayoutNode, LayoutLink>([]).id(
		(d) => d.id,
	);
	private populated = false;

	constructor(
		readonly cols: number,
		readonly rows: number,
		readonly pitch: number,
		private readonly rng: Rng = Math.random,
	) {
		this.xs = new Float64Array(cols * rows).fill(Number.NaN);
		this.ys = new Float64Array(cols * rows).fill(Number.NaN);
		this.byCell = new Array(cols * rows);
		const cx = (cols * pitch) / 2;
		const cy = (rows * pitch) / 2;
		this.simulation = forceSimulation<LayoutNode>()
			.force("link", this.links.distance(pitch * 0.9).strength(0.9))
			.force(
				"charge",
				forceManyBody<LayoutNode>()
					.strength(-pitch * 1.2)
					.distanceMax(pitch * 6),
			)
			.force("x", forceX<LayoutNode>(cx).strength(0.03))
			.force("y", forceY<LayoutNode>(cy).strength(0.05))
			.alphaDecay(0.03)
			.velocityDecay(0.4)
			.stop();
	}

	/** Rebuilds the graph from the board. Call whenever a wall appears or disappears. */
	sync(states: readonly CellState[]) {
		const nodes: LayoutNode[] = [];
		const open = (i: number) => states[i] !== "wall";
		const next: (LayoutNode | undefined)[] = new Array(this.cols * this.rows);
		for (let i = 0; i < next.length; i++) {
			if (!open(i)) continue;
			const node = this.byCell[i] ?? {
				id: i,
				// Tiny jitter: perfectly regular lattices give the many-body force nothing to push on.
				x: ((i % this.cols) + 0.5) * this.pitch + (this.rng() - 0.5),
				y: (Math.floor(i / this.cols) + 0.5) * this.pitch + (this.rng() - 0.5),
			};
			next[i] = node;
			nodes.push(node);
		}
		this.byCell = next;

		const links: LayoutLink[] = [];
		for (let i = 0; i < next.length; i++) {
			if (!open(i)) continue;
			if ((i % this.cols) + 1 < this.cols && open(i + 1))
				links.push({ source: i, target: i + 1 });
			if (i + this.cols < next.length && open(i + this.cols)) {
				links.push({ source: i, target: i + this.cols });
			}
		}
		this.simulation.nodes(nodes);
		this.links.links(links);
		// First layout runs hot; later board edits only nudge it.
		this.simulation.alpha(
			this.populated ? Math.max(this.simulation.alpha(), 0.2) : 1,
		);
		this.populated = true;
		this.publish();
	}

	/** Advances the simulation one tick. Returns true while the layout is still moving. */
	step(): boolean {
		if (this.simulation.alpha() < this.simulation.alphaMin()) return false;
		this.simulation.tick();
		const margin = this.pitch * 0.5;
		const maxX = this.cols * this.pitch - margin;
		const maxY = this.rows * this.pitch - margin;
		for (const n of this.simulation.nodes()) {
			n.x = Math.min(Math.max(n.x ?? 0, margin), maxX);
			n.y = Math.min(Math.max(n.y ?? 0, margin), maxY);
		}
		this.publish();
		return true;
	}

	/** Index of the node nearest to (x, y) within `radius` pixels, or null. */
	nearest(x: number, y: number, radius: number): number | null {
		let best: number | null = null;
		let bestDist = radius * radius;
		for (let i = 0; i < this.xs.length; i++) {
			const dx = (this.xs[i] as number) - x;
			const dy = (this.ys[i] as number) - y;
			const d = dx * dx + dy * dy;
			if (d <= bestDist) {
				bestDist = d;
				best = i;
			}
		}
		return best;
	}

	/**
	 * Publishes positions stretched so the graph's bounding box fills the whole canvas. The
	 * simulation itself stays in its natural compact space; only what gets drawn (and hit-tested)
	 * is rescaled, per axis, so the layout is not pulled into a blob around the center.
	 */
	private publish() {
		this.xs.fill(Number.NaN);
		this.ys.fill(Number.NaN);
		const nodes = this.simulation.nodes();
		if (nodes.length === 0) return;
		let minX = Number.POSITIVE_INFINITY;
		let maxX = Number.NEGATIVE_INFINITY;
		let minY = Number.POSITIVE_INFINITY;
		let maxY = Number.NEGATIVE_INFINITY;
		for (const n of nodes) {
			const x = n.x ?? 0;
			const y = n.y ?? 0;
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
		}
		const margin = this.pitch * 0.5;
		const fit = (v: number, lo: number, hi: number, size: number) =>
			hi - lo < 1e-6
				? size / 2
				: margin + ((v - lo) / (hi - lo)) * (size - 2 * margin);
		const width = this.cols * this.pitch;
		const height = this.rows * this.pitch;
		for (const n of nodes) {
			this.xs[n.id] = fit(n.x ?? 0, minX, maxX, width);
			this.ys[n.id] = fit(n.y ?? 0, minY, maxY, height);
		}
	}
}
