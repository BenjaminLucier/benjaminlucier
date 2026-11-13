import type { Point, SearchStep } from "./types";

/** Stops a running animation or search early. */
export type Cancel = () => void;

/** Steps through `items` with a delay between each, calling `onItem` for every one. */
export function runWithDelay<T>(
	items: T[],
	delayMs: number,
	onItem: (item: T) => void,
	onDone: () => void,
): Cancel {
	let index = 0;
	let cancelled = false;
	let timer: number | undefined;

	function step() {
		if (cancelled) return;
		if (index >= items.length) {
			onDone();
			return;
		}
		onItem(items[index++] as T);
		timer = window.setTimeout(step, delayMs);
	}

	step();
	return () => {
		cancelled = true;
		window.clearTimeout(timer);
	};
}

/** Drives a search generator on a timer so the UI thread never blocks. */
export function runSearch(
	generator: Generator<SearchStep, void, void>,
	delayMs: number,
	handlers: {
		onVisit: (x: number, y: number, from: Point | null) => void;
		onFound: (path: Point[]) => void;
		onFailed: () => void;
	},
): Cancel {
	let cancelled = false;
	let timer: number | undefined;

	function step() {
		if (cancelled) return;
		const { value, done } = generator.next();
		if (done) return;

		if (value.type === "visit") {
			handlers.onVisit(value.x, value.y, value.from);
			timer = window.setTimeout(step, delayMs);
		} else if (value.type === "found") {
			handlers.onFound(value.path);
		} else {
			handlers.onFailed();
		}
	}

	step();
	return () => {
		cancelled = true;
		window.clearTimeout(timer);
	};
}
