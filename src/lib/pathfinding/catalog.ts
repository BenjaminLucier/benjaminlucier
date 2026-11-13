import { randomMazeWalls, recursiveDivisionWalls } from "./maze";
import { astarSearch, bfsSearch, dfsSearch, dijkstraSearch } from "./search";
import type { MazeAlgorithm, MazeFn, PathAlgorithm, SearchFn } from "./types";

export const pathAlgorithms: Record<
	PathAlgorithm,
	{ label: string; fn: SearchFn }
> = {
	astar: { label: "A*", fn: astarSearch },
	dijkstra: { label: "Dijkstra's", fn: dijkstraSearch },
	bfs: { label: "BFS", fn: bfsSearch },
	dfs: { label: "DFS", fn: dfsSearch },
};

export const mazeAlgorithms: Record<
	MazeAlgorithm,
	{ label: string; fn: MazeFn }
> = {
	recursiveDivision: {
		label: "Recursive Division",
		fn: recursiveDivisionWalls,
	},
	random: {
		label: "Random",
		fn: (w, h, rng) => randomMazeWalls(w, h, undefined, rng),
	},
};
