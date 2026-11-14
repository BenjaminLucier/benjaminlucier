/** The LinkedIn headline, shown under your name; scripts/linkedin.ts copies it into cv/linkedin.md. */
export const headline = "Fullstack ML Engineer · Rust, Python, TypeScript";

/** Part of a paragraph: plain text, or text that the home page links. */
export type Span = string | { text: string; href: string };

/** Plain text of a paragraph, without its links (for LinkedIn). */
export const plain = (paragraph: Span[]) =>
	paragraph.map((s) => (typeof s === "string" ? s : s.text)).join("");

/**
 * The About text, one array per paragraph. The home page renders it with its
 * links, and scripts/linkedin.ts copies it into cv/linkedin.md as plain text.
 */
export const about: Span[][] = [
	[
		"I'm a founder and fullstack ML engineer who loves taking products from zero to one. I'm currently building ",
		{ text: "Incredible", href: "https://useincredible.com" },
		" full-time: one AI-powered workspace for notes, tasks, habits, fitness and flashcards, with an agent that works across all of it.",
	],
	[
		"I architect and build entire applications end to end, from the database and backend to the frontend, cloud infrastructure and CI/CD, mostly in Rust, Python, TypeScript and SQL. At ",
		{ text: "The Suite", href: "https://thesuite.com" },
		" I put ML recommendation systems into production that lifted engagement by up to 36% over baseline, owned the core API and billing infrastructure behind more than $10M ARR, and helped scale the engineering team 5x.",
	],
	[
		"I love an adventure: I've travelled to ~30 countries, circumnavigated Vancouver Island on a sailboat, ridden my motorcycle from coast to coast, splitboarded up and down mountains in the Rockies, Alps and BC Coastal Ranges. When I am not writing code or planning my next adventure, I like to play chess and read.",
	],
];
