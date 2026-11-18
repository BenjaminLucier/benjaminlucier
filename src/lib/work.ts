import type { Thumbnail } from "./thumbnails";

export interface WorkLinks {
	/** The live site or page. */
	site?: string;
	/** The source on GitHub, which also says it is open source. */
	repo?: string;
	/** The published crate on crates.io. */
	crate?: string;
	/** The published package (or scope) on npm. */
	npm?: string;
}

export interface Work {
	slug: string;
	title: string;
	summary: string;
	/** ISO date, YYYY-MM-DD, of the latest change; dates the sitemap. */
	date: string;
	/** Where the work lives; the card links straight to it. A path (`/…`) stays on this site. */
	href: string;
	/** Shown as icon links in the card's corner, in this order; `href` stays the card's own link. */
	links: WorkLinks;
	/** Not finished yet: marked with an α next to the title. */
	alpha?: boolean;
	/** Also shown in the Featured section on the home page, in this order. */
	featured?: boolean;
	/** Card image; see src/lib/thumbnails.ts. */
	thumbnail: Thumbnail;
}

export const work: Work[] = [
	{
		slug: "incredible",
		title: "incredible",
		summary:
			"A personal everything app: notes, typed tables, goals, fitness, flashcards and AI chat in one workspace.",
		date: "2026-10-13",
		href: "https://useincredible.com",
		links: { site: "https://useincredible.com" },
		featured: true,
		thumbnail: { scene: "generative", options: { style: "flow" } },
	},
	{
		slug: "pxstudio",
		title: "pxstudio",
		summary:
			"A pixel art and animation editor for the browser or desktop that works offline and is scriptable in Lua.",
		date: "2026-10-19",
		href: "https://pxstud.io",
		links: { site: "https://pxstud.io" },
		featured: true,
		thumbnail: { scene: "generative", options: { style: "dither" } },
	},
	{
		slug: "predict",
		title: "predict",
		summary:
			"A batteries-included machine learning framework for Rust, with a consistent, scikit-learn-style API.",
		date: "2026-11-18",
		href: "https://predict.rs",
		links: {
			site: "https://predict.rs",
			repo: "https://github.com/BenjaminLucier/predict",
			crate: "https://crates.io/crates/predict",
		},
		alpha: true,
		thumbnail: {
			scene: "glyph",
			// An italic maths serif, so the hat sits on the y (Mincho sets it beside it).
			options: {
				text: "ŷ",
				style: "italic 500",
				family: '"STIX Two Text", "Times New Roman", serif',
			},
		},
	},
	{
		slug: "sophistry",
		title: "sophistry",
		summary:
			"Manim-inspired, live maths animations and charts for the web, in TypeScript with SolidJS and React bindings.",
		date: "2026-10-31",
		href: "https://sophistry.dev",
		links: {
			site: "https://sophistry.dev",
			repo: "https://github.com/BenjaminLucier/sophistry",
			npm: "https://www.npmjs.com/org/sophistry",
		},
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
		links: {
			repo: "https://github.com/BenjaminLucier/cf-rs/tree/main/crates/cf-images",
			crate: "https://crates.io/crates/cf-images",
		},
		thumbnail: { scene: "generative", options: { style: "voronoi" } },
	},
	{
		slug: "cf-stream",
		title: "cf-stream",
		summary:
			"An async Rust client for Cloudflare Stream, published on crates.io as part of cf-rs.",
		date: "2026-10-21",
		href: "https://github.com/BenjaminLucier/cf-rs/tree/main/crates/cf-stream",
		links: {
			repo: "https://github.com/BenjaminLucier/cf-rs/tree/main/crates/cf-stream",
			crate: "https://crates.io/crates/cf-stream",
		},
		thumbnail: { scene: "generative", options: { style: "ridgelines" } },
	},
	{
		slug: "anzan",
		title: "anzan",
		summary:
			"A terminal trainer for mental math in Rust: timed drills, a stats dashboard and modes that find your weak spots.",
		date: "2026-11-13",
		href: "https://github.com/BenjaminLucier/anzan",
		links: {
			repo: "https://github.com/BenjaminLucier/anzan",
			crate: "https://crates.io/crates/anzan",
		},
		thumbnail: { scene: "glyph", options: { text: "暗算" } },
	},
	{
		slug: "gauntlet",
		title: "gauntlet",
		summary:
			"128 Rust practice problems in a terminal trainer that tests your code on save and times you against reference solutions.",
		date: "2026-11-16",
		href: "https://github.com/BenjaminLucier/gauntlet",
		links: {
			repo: "https://github.com/BenjaminLucier/gauntlet",
			crate: "https://crates.io/crates/gauntlet",
		},
		thumbnail: { scene: "glyph", options: { text: "128" } },
	},
	{
		slug: "maplibre-solidjs",
		title: "maplibre-solidjs",
		summary:
			"SolidJS 2 components for MapLibre GL JS, typed and faithful to its API: every option, event, source, layer and control.",
		date: "2026-11-18",
		href: "https://benjaminlucier.github.io/maplibre-solidjs/",
		links: {
			site: "https://benjaminlucier.github.io/maplibre-solidjs/",
			repo: "https://github.com/BenjaminLucier/maplibre-solidjs",
			npm: "https://www.npmjs.com/package/maplibre-solidjs",
		},
		thumbnail: { scene: "compass" },
	},
	{
		slug: "travel-nexus",
		title: "travel nexus",
		summary:
			"A map-first trip planner with shareable trips and places curated from the whole OpenStreetMap planet.",
		date: "2026-10-01",
		href: "https://travel.nexus",
		links: { site: "https://travel.nexus" },
		alpha: true,
		thumbnail: { scene: "map" },
	},
	{
		slug: "pathfinding",
		title: "pathfinding",
		summary:
			"A visualizer that races A*, Dijkstra, BFS and DFS on the same maze, drawn both as a grid and as a graph.",
		date: "2026-11-13",
		href: "/pathfinding",
		links: { site: "/pathfinding" },
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
		title: "portfolio",
		summary:
			"This site: my portfolio, CV and stack, rendered at build time to static HTML.",
		date: "2026-10-08",
		href: "https://benjaminlucier.com",
		links: {
			site: "https://benjaminlucier.com",
			repo: "https://github.com/BenjaminLucier/benjaminlucier",
		},
		thumbnail: { scene: "circumpunct" },
	},
];

export const getWork = (slug: string) => work.find((w) => w.slug === slug);
