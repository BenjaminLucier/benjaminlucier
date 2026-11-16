import type { Thumbnail } from "./thumbnails";

export interface Work {
	slug: string;
	title: string;
	summary: string;
	/** ISO date, YYYY-MM-DD, of the latest change; dates the sitemap. */
	date: string;
	/** Where the work lives; the card links straight to it. A path (`/…`) stays on this site. */
	href: string;
	/** Status ("Alpha" or "Live"); shown as a label on the card. */
	status?: string;
	/** Shown as an "Open Source" label next to the status. */
	openSource?: boolean;
	/** Also shown in the Featured section on the home page, in this order. */
	featured?: boolean;
	/** Card image; see src/lib/thumbnails.ts. */
	thumbnail: Thumbnail;
}

export const work: Work[] = [
	{
		slug: "incredible",
		title: "Incredible",
		summary:
			"A personal everything app: notes, typed tables, goals, fitness, flashcards and AI chat in one workspace.",
		date: "2026-10-13",
		href: "https://useincredible.com",
		status: "Alpha",
		featured: true,
		thumbnail: { scene: "generative", options: { style: "flow" } },
	},
	{
		slug: "pxstudio",
		title: "PXStudio",
		summary:
			"A pixel art and animation editor for the browser or desktop that works offline and is scriptable in Lua.",
		date: "2026-10-19",
		href: "https://pxstud.io",
		status: "Live",
		featured: true,
		thumbnail: { scene: "generative", options: { style: "dither" } },
	},
	{
		slug: "sophistry",
		title: "Sophistry",
		summary:
			"Manim-inspired, live maths animations and charts for the web, in TypeScript with SolidJS and React bindings.",
		date: "2026-10-31",
		href: "https://sophistry.dev",
		openSource: true,
		featured: true,
		thumbnail: { scene: "epicycle" },
	},
	{
		slug: "cf-images",
		title: "cf-images",
		summary:
			"An async Rust client for Cloudflare Images, published on crates.io as part of cf-rs.",
		date: "2026-10-21",
		href: "https://github.com/BenjaminLucier/cf-rs/tree/main/crates/cf-images",
		openSource: true,
		thumbnail: { scene: "generative", options: { style: "voronoi" } },
	},
	{
		slug: "cf-stream",
		title: "cf-stream",
		summary:
			"An async Rust client for Cloudflare Stream, published on crates.io as part of cf-rs.",
		date: "2026-10-21",
		href: "https://github.com/BenjaminLucier/cf-rs/tree/main/crates/cf-stream",
		openSource: true,
		thumbnail: { scene: "generative", options: { style: "ridgelines" } },
	},
	{
		slug: "anzan",
		title: "Anzan",
		summary:
			"A terminal trainer for mental math in Rust: timed drills, a stats dashboard and modes that find your weak spots.",
		date: "2026-11-13",
		href: "https://github.com/BenjaminLucier/anzan",
		openSource: true,
		thumbnail: { scene: "glyph", options: { text: "暗算" } },
	},
	{
		slug: "gauntlet",
		title: "Gauntlet",
		summary:
			"128 Rust practice problems in a terminal trainer that tests your code on save and times you against reference solutions.",
		date: "2026-11-16",
		href: "https://github.com/BenjaminLucier/gauntlet",
		openSource: true,
		thumbnail: { scene: "glyph", options: { text: "128" } },
	},
	{
		slug: "travel-nexus",
		title: "Travel Nexus",
		summary:
			"A map-first trip planner with shareable trips and places curated from the whole OpenStreetMap planet.",
		date: "2026-10-01",
		href: "https://travel.nexus",
		status: "Alpha",
		thumbnail: { scene: "map" },
	},
	{
		slug: "pathfinding",
		title: "Pathfinding",
		summary:
			"A visualizer that races A*, Dijkstra, BFS and DFS on the same maze, drawn both as a grid and as a graph.",
		date: "2026-11-13",
		href: "/pathfinding",
		thumbnail: {
			scene: "pathfinding",
			options: {
				seed: 5,
				algorithm: "bfs",
				cell: 20,
				progress: 0.85,
				pathShown: 0.75,
			},
		},
	},
	{
		slug: "benjaminlucier",
		title: "Portfolio",
		summary:
			"This site: my portfolio, CV and stack, rendered at build time to static HTML.",
		date: "2026-10-08",
		href: "https://benjaminlucier.com",
		status: "Live",
		thumbnail: { scene: "circumpunct" },
	},
];

export const getWork = (slug: string) => work.find((w) => w.slug === slug);
