import { at, Grid } from "./grid";
import type { IsWall, Point, SearchMetrics, SearchStep } from "./types";

/** right, down, left, up */
const DIRS: [number, number][] = [
	[1, 0],
	[0, 1],
	[-1, 0],
	[0, -1],
];

/** up, left, down, right: the stack pops right first, so DFS leans rightward. */
const DIRS_DFS: [number, number][] = [
	[0, -1],
	[-1, 0],
	[0, 1],
	[1, 0],
];

export const createMetrics = (): SearchMetrics => ({ ops: 0, peakFrontier: 0 });

/** A cell plus a link back to the cell it was reached from. Paths are rebuilt from these links. */
type Node = Point & { prev: Node | null; cost: number };

function inBounds(x: number, y: number, width: number, height: number) {
	return x >= 0 && x < width && y >= 0 && y < height;
}

function buildPath(node: Node): Point[] {
	const path: Point[] = [];
	for (let n: Node | null = node; n; n = n.prev) path.push({ x: n.x, y: n.y });
	return path.reverse();
}

/** Binary min-heap. Ties break first-in-first-out so results are deterministic. */
class MinHeap<T> {
	private items: { value: T; rank: number; order: number }[] = [];
	private counter = 0;

	constructor(private readonly metrics: SearchMetrics) {}

	get size() {
		return this.items.length;
	}

	push(value: T, rank: number) {
		this.metrics.ops++;
		this.items.push({ value, rank, order: this.counter++ });
		this.metrics.peakFrontier = Math.max(
			this.metrics.peakFrontier,
			this.items.length,
		);
		let i = this.items.length - 1;
		while (i > 0) {
			const parent = (i - 1) >> 1;
			if (this.less(parent, i)) break;
			this.swap(parent, i);
			i = parent;
		}
	}

	pop(): T | undefined {
		this.metrics.ops++;
		const top = this.items[0];
		const last = this.items.pop();
		if (!top || !last) return undefined;
		if (this.items.length > 0) {
			this.items[0] = last;
			let i = 0;
			for (;;) {
				const l = i * 2 + 1;
				const r = l + 1;
				let smallest = i;
				if (l < this.items.length && this.less(l, smallest)) smallest = l;
				if (r < this.items.length && this.less(r, smallest)) smallest = r;
				if (smallest === i) break;
				this.swap(i, smallest);
				i = smallest;
			}
		}
		return top.value;
	}

	private less(a: number, b: number) {
		this.metrics.ops++;
		const x = at(this.items, a);
		const y = at(this.items, b);
		return x.rank < y.rank || (x.rank === y.rank && x.order < y.order);
	}

	private swap(a: number, b: number) {
		[this.items[a], this.items[b]] = [at(this.items, b), at(this.items, a)];
	}
}

/** Breadth-first search: explores layer by layer, so the first path found is a shortest one. */
export function* bfsSearch(
	width: number,
	height: number,
	start: Point,
	end: Point,
	isWall: IsWall,
	metrics: SearchMetrics,
): Generator<SearchStep, void, void> {
	const seen = new Grid(width, height, false);
	seen.set(start.x, start.y, true);
	const queue: Node[] = [{ ...start, prev: null, cost: 0 }];
	metrics.ops++;
	metrics.peakFrontier = 1;

	for (let head = 0; head < queue.length; head++) {
		const current = at(queue, head);
		metrics.ops++;
		yield { type: "visit", x: current.x, y: current.y, from: current.prev };

		if (current.x === end.x && current.y === end.y) {
			yield { type: "found", path: buildPath(current) };
			return;
		}

		for (const [dx, dy] of DIRS) {
			const nx = current.x + dx;
			const ny = current.y + dy;
			metrics.ops++;
			if (seen.inBounds(nx, ny) && !seen.get(nx, ny) && !isWall(nx, ny)) {
				seen.set(nx, ny, true);
				queue.push({ x: nx, y: ny, prev: current, cost: current.cost + 1 });
				metrics.ops++;
				metrics.peakFrontier = Math.max(
					metrics.peakFrontier,
					queue.length - head - 1,
				);
			}
		}
	}

	yield { type: "failed" };
}

/** Depth-first search: follows one branch as far as it goes before backtracking. Not shortest. */
export function* dfsSearch(
	width: number,
	height: number,
	start: Point,
	end: Point,
	isWall: IsWall,
	metrics: SearchMetrics,
): Generator<SearchStep, void, void> {
	const explored = new Grid(width, height, false);
	const stack: Node[] = [{ ...start, prev: null, cost: 0 }];
	metrics.ops++;
	metrics.peakFrontier = 1;

	// Marked explored when popped, not pushed: marking at push time lets a shallow
	// ancestor claim cells ahead of the active branch and the walk appears to teleport.
	while (stack.length > 0) {
		const current = stack.pop() as Node;
		metrics.ops++;
		if (explored.get(current.x, current.y)) continue;
		explored.set(current.x, current.y, true);
		yield { type: "visit", x: current.x, y: current.y, from: current.prev };

		if (current.x === end.x && current.y === end.y) {
			yield { type: "found", path: buildPath(current) };
			return;
		}

		for (const [dx, dy] of DIRS_DFS) {
			const nx = current.x + dx;
			const ny = current.y + dy;
			metrics.ops++;
			if (
				inBounds(nx, ny, width, height) &&
				!explored.get(nx, ny) &&
				!isWall(nx, ny)
			) {
				stack.push({ x: nx, y: ny, prev: current, cost: current.cost + 1 });
				metrics.ops++;
				metrics.peakFrontier = Math.max(metrics.peakFrontier, stack.length);
			}
		}
	}

	yield { type: "failed" };
}

const manhattan = (x: number, y: number, end: Point) =>
	Math.abs(x - end.x) + Math.abs(y - end.y);

/** Shared driver for Dijkstra and A*, which differ only in how the open set is ranked. */
function* bestFirst(
	width: number,
	height: number,
	start: Point,
	end: Point,
	isWall: IsWall,
	metrics: SearchMetrics,
	heuristic: (x: number, y: number) => number,
): Generator<SearchStep, void, void> {
	const bestCost = new Grid(width, height, Number.POSITIVE_INFINITY);
	const closed = new Grid(width, height, false);
	const open = new MinHeap<Node>(metrics);
	bestCost.set(start.x, start.y, 0);
	open.push({ ...start, prev: null, cost: 0 }, heuristic(start.x, start.y));

	while (open.size > 0) {
		const current = open.pop() as Node;
		if (closed.get(current.x, current.y)) continue;
		closed.set(current.x, current.y, true);
		yield { type: "visit", x: current.x, y: current.y, from: current.prev };

		if (current.x === end.x && current.y === end.y) {
			yield { type: "found", path: buildPath(current) };
			return;
		}

		for (const [dx, dy] of DIRS) {
			const nx = current.x + dx;
			const ny = current.y + dy;
			metrics.ops++;
			if (!closed.inBounds(nx, ny) || closed.get(nx, ny) || isWall(nx, ny))
				continue;
			const cost = current.cost + 1;
			if (cost >= bestCost.get(nx, ny)) continue;
			bestCost.set(nx, ny, cost);
			open.push(
				{ x: nx, y: ny, prev: current, cost },
				cost + heuristic(nx, ny),
			);
		}
	}

	yield { type: "failed" };
}

/** Dijkstra's algorithm: expands the cell closest to the start. Always finds a shortest path. */
export function dijkstraSearch(
	width: number,
	height: number,
	start: Point,
	end: Point,
	isWall: IsWall,
	metrics: SearchMetrics,
) {
	return bestFirst(width, height, start, end, isWall, metrics, () => 0);
}

/** A*: like Dijkstra, but biased toward the end by the Manhattan distance remaining. */
export function astarSearch(
	width: number,
	height: number,
	start: Point,
	end: Point,
	isWall: IsWall,
	metrics: SearchMetrics,
) {
	return bestFirst(width, height, start, end, isWall, metrics, (x, y) =>
		manhattan(x, y, end),
	);
}
