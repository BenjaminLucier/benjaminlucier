import { Link } from "@kobalte/core/link";
import { createSignal, For, onSettled } from "solid-js";
import ThemeToggle from "~/components/ThemeToggle";
import Button from "~/components/ui/Button";
import Checkbox from "~/components/ui/Checkbox";
import Select from "~/components/ui/Select";
import { mazeAlgorithms, pathAlgorithms } from "~/lib/pathfinding/catalog";
import { GraphRenderer } from "~/lib/pathfinding/graphView";
import { GridRenderer } from "~/lib/pathfinding/gridView";
import { GraphLayout } from "~/lib/pathfinding/layout";
import { currentPalette } from "~/lib/pathfinding/palette";
import { type Cancel, runSearch, runWithDelay } from "~/lib/pathfinding/runner";
import { createMetrics } from "~/lib/pathfinding/search";
import type {
	CellState,
	MazeAlgorithm,
	PathAlgorithm,
	Point,
} from "~/lib/pathfinding/types";

const mazeOptions = Object.entries(mazeAlgorithms).map(
	([value, { label }]) => ({
		value: value as MazeAlgorithm,
		label,
	}),
);
const pathOptions = Object.entries(pathAlgorithms).map(
	([value, { label }]) => ({
		value: value as PathAlgorithm,
		label,
	}),
);

/** Both panels step at the same rate so visited-cell counts are a fair comparison. */
const SEARCH_DELAY_MS = 8;
const PATH_DELAY_MS = 30;
const AUTO_SOLVE_DELAY_MS = 600;
const WALL_DELAY_MS = 2;

const PANELS = [0, 1] as const;
const VIEWS = ["grid", "graph"] as const;
type View = (typeof VIEWS)[number];

type Status = "idle" | "searching" | "finished" | "generating";
type Dragging = "none" | "start" | "end" | "wall";
type Hit = Point & { view: View };

type Stats = {
	outcome: "none" | "running" | "found" | "failed";
	visited: number;
	pathLength: number;
	/** Abstract operations performed so far; see `SearchMetrics`. */
	ops: number;
	/** Peak nodes held in the frontier. */
	memory: number;
};

const emptyStats = (): Stats => ({
	outcome: "none",
	visited: 0,
	pathLength: 0,
	ops: 0,
	memory: 0,
});

/** Legend swatches: the same Catppuccin roles the canvases use (see `palette.ts`). */
const cellColor: Record<CellState, string> = {
	idle: "bg-ctp-overlay0",
	wall: "bg-ctp-text dark:bg-ctp-crust",
	start: "bg-ctp-green",
	end: "bg-ctp-red",
	search: "bg-ctp-sapphire",
	path: "bg-ctp-mauve",
};

/** Preferred cell size for a quadrant, by its shorter side. */
const cellSizeFor = (side: number) =>
	side >= 440 ? 20 : side >= 320 ? 18 : side >= 200 ? 14 : 12;

const randomBetween = (low: number, high: number) =>
	low + Math.floor(Math.random() * (high - low + 1));

const makeOdd = (n: number) => (n % 2 === 0 ? n - 1 : n);

const perPanel = <T,>(make: () => T): [T, T] => [make(), make()];

export default function Pathfinding() {
	let rootRef: HTMLDivElement | undefined;
	let containerRef: HTMLDivElement | undefined;
	/** One quadrant of the 2x2 board grid; all four are the same size. */
	let quadrantRef: HTMLDivElement | undefined;
	// The board everyone shares: walls, start and end.
	let cellStates: CellState[] = [];
	// What each panel currently shows (search/path marks included).
	let panelStates: CellState[][] = [[], []];
	let parents: Int32Array[] = perPanel(() => new Int32Array(0));
	/** performance.now() of each cell's last state change / return from being a wall. */
	let changedAt: Float64Array[] = perPanel(() => new Float64Array(0));
	let appearedAt: Float64Array[] = perPanel(() => new Float64Array(0));
	const gridRenderers = perPanel(() => new GridRenderer());
	const graphRenderers = perPanel(() => new GraphRenderer());
	const canvasRefs: Record<View, (HTMLCanvasElement | undefined)[]> = {
		grid: [],
		graph: [],
	};
	// One layout shared by both panels: they always show the same walls.
	let layout = new GraphLayout(0, 0, 20);
	let layoutDirty = true;
	let pitch = 20;
	let cols = 0;
	let rows = 0;
	let start: Point = { x: 0, y: 0 };
	let end: Point = { x: 0, y: 0 };
	let dragging: Dragging = "none";
	let wallPaint: CellState = "wall";
	let pointerActive = false;
	let interactionSource: Point | null = null;
	let lastHover: Point | null = null;
	let dragHighlight: (Point & { kind: "start" | "end" }) | null = null;
	let drawQueued = false;
	// Page-load demo: generate, then solve, unless the user does anything first.
	let autoSolve = false;
	let showGridLines = false;
	const activeCancels: (Cancel | null)[] = [null, null];

	const [gridSize, setGridSize] = createSignal({
		cols: 0,
		rows: 0,
		cellPx: 20,
	});
	const [status, setStatus] = createSignal<Status>("idle");
	const [showGrid, setShowGrid] = createSignal(false);
	const [mazeAlgo, setMazeAlgo] =
		createSignal<MazeAlgorithm>("recursiveDivision");
	const algoSignals = [
		createSignal<PathAlgorithm>("astar"),
		createSignal<PathAlgorithm>("dijkstra"),
	] as const;
	const statsSignals = [
		createSignal<Stats>(emptyStats()),
		createSignal<Stats>(emptyStats()),
	] as const;

	const idx = (x: number, y: number) => y * cols + x;
	const getCellState = (x: number, y: number): CellState =>
		cellStates[idx(x, y)] ?? "idle";
	const isWall = (x: number, y: number) => getCellState(x, y) === "wall";

	/** Redraws all canvases once per frame, and keeps going while anything is animating. */
	function scheduleDraw() {
		if (drawQueued) return;
		drawQueued = true;
		requestAnimationFrame(() => {
			drawQueued = false;
			const now = performance.now();
			const palette = currentPalette();
			if (layoutDirty) {
				layout.sync(panelStates[0] ?? []);
				layoutDirty = false;
			}
			let animating = layout.step();
			for (const panel of PANELS) {
				const states = panelStates[panel];
				const panelParents = parents[panel];
				const panelChanged = changedAt[panel];
				const panelAppeared = appearedAt[panel];
				if (!states || !panelParents || !panelChanged || !panelAppeared)
					continue;

				const gridCanvas = canvasRefs.grid[panel];
				if (gridCanvas) {
					const busy = gridRenderers[panel].draw(gridCanvas, {
						cols,
						rows,
						pitch,
						states,
						changedAt: panelChanged,
						now,
						palette,
						showGrid: showGridLines,
						highlight: dragHighlight,
					});
					animating ||= busy;
				}
				const graphCanvas = canvasRefs.graph[panel];
				if (graphCanvas) {
					const busy = graphRenderers[panel].draw(graphCanvas, {
						cols,
						rows,
						pitch,
						states,
						xs: layout.xs,
						ys: layout.ys,
						parents: panelParents,
						changedAt: panelChanged,
						appearedAt: panelAppeared,
						now,
						palette,
						highlight: dragHighlight,
					});
					animating ||= busy;
				}
			}
			if (animating) scheduleDraw();
		});
	}

	/** Paints one panel's cell without touching the shared board state. */
	function paintPanelCell(
		panel: number,
		x: number,
		y: number,
		state: CellState,
	) {
		const i = idx(x, y);
		const states = panelStates[panel] as CellState[];
		const before = states[i];
		if (before !== state) {
			if ((before === "wall") !== (state === "wall")) layoutDirty = true;
			if (before === "wall") {
				(appearedAt[panel] as Float64Array)[i] = performance.now();
			}
			states[i] = state;
			(changedAt[panel] as Float64Array)[i] = performance.now();
		}
		scheduleDraw();
	}

	/** Updates the shared board and repaints the cell in both panels. */
	function setCellState(x: number, y: number, state: CellState) {
		cellStates[idx(x, y)] = state;
		for (const panel of PANELS) paintPanelCell(panel, x, y, state);
	}

	function stopActive() {
		for (const panel of PANELS) {
			activeCancels[panel]?.();
			activeCancels[panel] = null;
		}
	}

	/** Removes search/path marks, leaving walls, start and end. */
	function clearSearch() {
		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				for (const panel of PANELS) {
					paintPanelCell(panel, x, y, getCellState(x, y));
				}
			}
		}
		for (const p of parents) p.fill(-1);
		for (const [, setStats] of statsSignals) setStats(emptyStats());
	}

	/** Sizes the board so each view (maze or graph) fits a `widthPx` x `heightPx` quadrant. */
	function initGrid(widthPx: number, heightPx: number) {
		const targetPx = cellSizeFor(Math.min(widthPx, heightPx));
		cols = Math.max(makeOdd(Math.floor(widthPx / targetPx)), 5);
		rows = Math.max(makeOdd(Math.floor(heightPx / targetPx)), 5);
		// Stretch cells slightly so the board fills the quadrant along its tighter side.
		const cellPx = Math.min(widthPx / cols, heightPx / rows);
		const total = cols * rows;
		cellStates = new Array(total).fill("idle");
		panelStates = perPanel(() => new Array<CellState>(total).fill("idle"));
		parents = perPanel(() => new Int32Array(total).fill(-1));
		changedAt = perPanel(() => new Float64Array(total));
		appearedAt = perPanel(() => new Float64Array(total));
		pitch = cellPx;
		layout = new GraphLayout(cols, rows, cellPx);
		layoutDirty = true;
		setGridSize({ cols, rows, cellPx });
		scheduleDraw();
	}

	function randomizeStartEnd() {
		let sx: number;
		let sy: number;
		let ex: number;
		let ey: number;
		do {
			sx = randomBetween(1, cols - 2);
			sy = randomBetween(1, rows - 2);
		} while (isWall(sx, sy));
		do {
			ex = randomBetween(1, cols - 2);
			ey = randomBetween(1, rows - 2);
		} while ((ex === sx && ey === sy) || isWall(ex, ey));
		start = { x: sx, y: sy };
		end = { x: ex, y: ey };
		setCellState(sx, sy, "start");
		setCellState(ex, ey, "end");
	}

	function reset() {
		stopActive();
		if (!quadrantRef) return;
		const { width, height } = quadrantRef.getBoundingClientRect();
		initGrid(width, height);
		randomizeStartEnd();
		for (const [, setStats] of statsSignals) setStats(emptyStats());
		setStatus("idle");
		dragging = "none";
		pointerActive = false;
		interactionSource = null;
		lastHover = null;
		dragHighlight = null;
	}

	function runSolve() {
		if (status() === "searching" || status() === "generating") return;
		clearSearch();
		setStatus("searching");

		let remaining = PANELS.length;
		const finishPanel = (panel: number) => {
			activeCancels[panel] = null;
			if (--remaining === 0) setStatus("finished");
		};

		for (const panel of PANELS) {
			const [algo] = algoSignals[panel];
			const [, setStats] = statsSignals[panel];
			let visited = 0;
			const metrics = createMetrics();
			const counters = (): Pick<Stats, "ops" | "memory"> => ({
				ops: metrics.ops,
				memory: metrics.peakFrontier,
			});
			setStats({ ...emptyStats(), outcome: "running" });

			activeCancels[panel] = runSearch(
				pathAlgorithms[algo()].fn(cols, rows, start, end, isWall, metrics),
				SEARCH_DELAY_MS,
				{
					onVisit: (x, y, from) => {
						visited++;
						if (from) {
							(parents[panel] as Int32Array)[idx(x, y)] = idx(from.x, from.y);
						}
						setStats((s) => ({ ...s, visited, ...counters() }));
						const isEndpoint =
							(x === start.x && y === start.y) || (x === end.x && y === end.y);
						if (!isEndpoint) paintPanelCell(panel, x, y, "search");
					},
					onFound: (path) => {
						setStats((s) => ({
							...s,
							outcome: "found",
							pathLength: path.length - 1,
							...counters(),
						}));
						activeCancels[panel] = runWithDelay(
							path.slice(1, -1),
							PATH_DELAY_MS,
							(p) => paintPanelCell(panel, p.x, p.y, "path"),
							() => finishPanel(panel),
						);
					},
					onFailed: () => {
						setStats((s) => ({ ...s, outcome: "failed", ...counters() }));
						finishPanel(panel);
					},
				},
			);
		}
	}

	function runGenerateMaze() {
		if (status() === "searching" || status() === "generating") return;
		stopActive();
		setStatus("generating");
		for (const [, setStats] of statsSignals) setStats(emptyStats());
		for (const p of parents) p.fill(-1);

		for (let i = 0; i < cellStates.length; i++) cellStates[i] = "idle";
		const walls = mazeAlgorithms[mazeAlgo()].fn(cols, rows);
		for (const { x, y } of walls) cellStates[idx(x, y)] = "wall";
		randomizeStartEnd();

		// Repaint every cell as idle first, then pop the walls in one by one.
		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				const state = getCellState(x, y);
				const shown = state === "wall" ? "idle" : state;
				for (const panel of PANELS) paintPanelCell(panel, x, y, shown);
			}
		}
		activeCancels[0] = runWithDelay(
			walls,
			WALL_DELAY_MS,
			(p) => {
				for (const panel of PANELS) paintPanelCell(panel, p.x, p.y, "wall");
			},
			() => {
				activeCancels[0] = null;
				setStatus("idle");
				if (autoSolve) {
					// Brief pause so the finished maze reads before the search starts.
					window.setTimeout(() => {
						if (autoSolve) runSolve();
						autoSolve = false;
					}, AUTO_SOLVE_DELAY_MS);
				}
			},
		);
	}

	function handleInteractionStart(hit: Hit) {
		if (status() === "searching" || status() === "generating") return;
		const state = getCellState(hit.x, hit.y);
		// Walls are not in the graph, so there only the endpoints can be grabbed.
		// Other clicks there leave the finished search untouched.
		if (hit.view === "graph" && state !== "start" && state !== "end") return;
		if (status() === "finished") {
			clearSearch();
			setStatus("idle");
		}
		if (state === "start") {
			dragging = "start";
		} else if (state === "end") {
			dragging = "end";
		} else {
			// The first cell decides whether this drag draws or erases.
			dragging = "wall";
			wallPaint = state === "wall" ? "idle" : "wall";
			setCellState(hit.x, hit.y, wallPaint);
		}
	}

	function setDragHighlight(x: number, y: number) {
		dragHighlight = { x, y, kind: dragging === "start" ? "start" : "end" };
		scheduleDraw();
	}

	function clearDragHighlight() {
		dragHighlight = null;
		scheduleDraw();
	}

	function handleInteractionEnter(hit: Hit) {
		if (status() === "searching" || status() === "generating") return;
		if (dragging === "start" || dragging === "end") {
			setDragHighlight(hit.x, hit.y);
		} else if (dragging === "wall" && hit.view === "grid") {
			const state = getCellState(hit.x, hit.y);
			if (state !== "start" && state !== "end") {
				setCellState(hit.x, hit.y, wallPaint);
			}
		}
	}

	function handleInteractionEnd(x: number, y: number) {
		const target = getCellState(x, y);
		if (dragging === "start" && target === "idle") {
			setCellState(start.x, start.y, "idle");
			start = { x, y };
			setCellState(x, y, "start");
		} else if (dragging === "end" && target === "idle") {
			setCellState(end.x, end.y, "idle");
			end = { x, y };
			setCellState(x, y, "end");
		}
		clearDragHighlight();
		dragging = "none";
	}

	/** Maps a pointer position to a cell: by position on the maze, by nearest node on the graph. */
	function cellAtPoint(clientX: number, clientY: number): Hit | null {
		const el = document.elementFromPoint(clientX, clientY);
		if (!(el instanceof HTMLCanvasElement)) return null;
		const view = el.dataset.view;
		const rect = el.getBoundingClientRect();
		const px = clientX - rect.left;
		const py = clientY - rect.top;
		if (view === "grid") {
			const x = Math.floor(px / pitch);
			const y = Math.floor(py / pitch);
			return x >= 0 && x < cols && y >= 0 && y < rows ? { x, y, view } : null;
		}
		if (view === "graph") {
			const i = layout.nearest(px, py, pitch * 0.6);
			return i === null ? null : { x: i % cols, y: Math.floor(i / cols), view };
		}
		return null;
	}

	function onPointerDown(event: PointerEvent) {
		const hit = cellAtPoint(event.clientX, event.clientY);
		if (!hit) return;
		event.preventDefault();
		pointerActive = true;
		interactionSource = hit;
		lastHover = hit;
		handleInteractionStart(hit);
	}

	function onPointerMove(event: PointerEvent) {
		if (!pointerActive) return;
		const hit = cellAtPoint(event.clientX, event.clientY);
		if (hit && lastHover && hit.x === lastHover.x && hit.y === lastHover.y) {
			return;
		}
		if (lastHover) clearDragHighlight();
		lastHover = hit;
		const isSource =
			hit &&
			interactionSource &&
			hit.x === interactionSource.x &&
			hit.y === interactionSource.y;
		if (hit && !isSource) handleInteractionEnter(hit);
	}

	function onWindowPointerUp() {
		if (!pointerActive) return;
		pointerActive = false;
		if (lastHover) handleInteractionEnd(lastHover.x, lastHover.y);
		else dragging = "none";
		interactionSource = null;
		lastHover = null;
	}

	onSettled(() => {
		let lastWidth = 0;
		let lastHeight = 0;
		let firstLoad = true;
		// The page is sized to the small viewport (svh), so mobile browser chrome
		// showing and hiding doesn't resize the quadrants and wipe the board.
		const observer = new ResizeObserver((entries) => {
			const rect = entries[0]?.contentRect;
			if (!rect) return;
			if (
				Math.abs(rect.width - lastWidth) < 1 &&
				Math.abs(rect.height - lastHeight) < 1
			)
				return;
			lastWidth = rect.width;
			lastHeight = rect.height;
			autoSolve = false;
			reset();
			// The first measurement is page load: start with a fresh maze.
			if (firstLoad) {
				firstLoad = false;
				autoSolve = true;
				runGenerateMaze();
			}
		});
		if (quadrantRef) observer.observe(quadrantRef);
		window.addEventListener("pointerup", onWindowPointerUp);
		window.addEventListener("pointercancel", onWindowPointerUp);
		// Repaint the canvases when the site theme changes.
		const themeObserver = new MutationObserver(scheduleDraw);
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-mode"],
		});
		// Any interaction with the controls or boards cancels the automatic demo.
		const cancelAutoSolve = () => {
			autoSolve = false;
		};
		const interactionEvents = ["pointerdown", "keydown", "change"] as const;
		for (const type of interactionEvents) {
			rootRef?.addEventListener(type, cancelAutoSolve, true);
		}

		return () => {
			for (const type of interactionEvents) {
				rootRef?.removeEventListener(type, cancelAutoSolve, true);
			}
			observer.disconnect();
			themeObserver.disconnect();
			window.removeEventListener("pointerup", onWindowPointerUp);
			window.removeEventListener("pointercancel", onWindowPointerUp);
			stopActive();
		};
	});

	const busy = () => status() === "searching" || status() === "generating";

	const legend = [
		[cellColor.start, "Start"],
		[cellColor.end, "End"],
		[cellColor.idle, "Open"],
		[cellColor.wall, "Wall"],
		[cellColor.search, "Searched"],
		[cellColor.path, "Path"],
	] as const;

	return (
		<div
			ref={rootRef}
			class="flex h-svh flex-col gap-3 overflow-hidden p-3 font-sans sm:p-4"
		>
			<header class="flex flex-wrap items-center gap-x-4 gap-y-2">
				<Link href="/portfolio" class="meta-link shrink-0">
					← Portfolio
				</Link>
				<h1 class="font-serif text-xl font-bold text-ink">Pathfinding</h1>
				<div class="flex flex-1 flex-wrap items-center justify-center gap-2">
					<Button variant="primary" disabled={busy()} onClick={runSolve}>
						Find path
					</Button>
					<Select
						label="Maze algorithm"
						disabled={busy()}
						value={mazeAlgo()}
						options={mazeOptions}
						onChange={setMazeAlgo}
					/>
					<Button disabled={busy()} onClick={runGenerateMaze}>
						Generate maze
					</Button>
					<Button onClick={reset}>Reset</Button>
					<Checkbox
						checked={showGrid()}
						onChange={(on) => {
							setShowGrid(on);
							showGridLines = on;
							scheduleDraw();
						}}
					>
						Show grid
					</Checkbox>
				</div>
				<div class="flex shrink-0 items-center">
					<ThemeToggle />
				</div>
			</header>

			{/* Phones need every pixel for the boards; the colours read without a key. */}
			<div class="hidden flex-wrap items-center justify-center gap-x-5 gap-y-1 sm:flex">
				<ul
					class="meta flex flex-wrap justify-center gap-x-4 gap-y-1"
					aria-label="Legend"
				>
					<For each={legend}>
						{([cls, label]) => (
							<li class="flex items-center gap-1.5">
								<span class={`inline-block size-3 ${cls}`} />
								{label}
							</li>
						)}
					</For>
				</ul>
				<p class="meta hidden lg:block">
					Drag the start or end to move it; drag on a maze to draw or erase
					walls. Graphs show open cells only, spread by a force layout.
				</p>
			</div>

			<div
				ref={containerRef}
				class="grid min-h-0 flex-1 grid-cols-2 grid-rows-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-3 gap-y-1 select-none sm:gap-x-4"
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
			>
				<For each={[...PANELS]}>
					{(panel) => {
						const [algo, setAlgo] = algoSignals[panel];
						const [stats] = statsSignals[panel];
						return (
							<>
								<div
									class={`col-span-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 ${panel === 1 ? "mt-2" : ""}`}
								>
									<Select
										label={`Algorithm for board ${panel + 1}`}
										disabled={busy()}
										value={algo()}
										options={pathOptions}
										onChange={setAlgo}
									/>
									<dl
										class="meta flex flex-wrap gap-x-4 gap-y-0.5 tabular-nums"
										aria-live="polite"
									>
										<div class="flex gap-1.5">
											<dt>Visited</dt>
											<dd class="text-ink">{stats().visited}</dd>
										</div>
										<div class="flex gap-1.5">
											<dt>Path</dt>
											<dd class="text-ink">
												{stats().outcome === "found"
													? stats().pathLength
													: stats().outcome === "failed"
														? "none"
														: "–"}
											</dd>
										</div>
										<div class="flex gap-1.5">
											<dt title="Neighbour checks, frontier pushes and pops, and heap comparisons">
												Ops
											</dt>
											<dd class="text-ink">{stats().ops.toLocaleString()}</dd>
										</div>
										<div class="flex gap-1.5">
											<dt title="Most nodes held in the queue, stack or heap at once">
												Memory
											</dt>
											<dd class="text-ink">
												{stats().memory.toLocaleString()} nodes
											</dd>
										</div>
									</dl>
								</div>
								<For each={[...VIEWS]}>
									{(view) => (
										<div
											ref={(el) => {
												if (panel === 0 && view === "grid") quadrantRef = el;
											}}
											class="relative flex min-h-0 min-w-0 items-center justify-center"
										>
											<canvas
												ref={(el) => {
													canvasRefs[view][panel] = el;
													scheduleDraw();
												}}
												data-view={view}
												role="img"
												aria-label={`${view === "grid" ? "Maze" : "Graph"} view of board ${panel + 1}`}
												class="block touch-none"
												style={{
													width: `${gridSize().cols * gridSize().cellPx}px`,
													height: `${gridSize().rows * gridSize().cellPx}px`,
												}}
											/>
										</div>
									)}
								</For>
							</>
						);
					}}
				</For>
			</div>
		</div>
	);
}
