// Generates the discovery files in public/ from the site and project data
// in src/lib:
//   llms.txt    — llmstxt.org overview for AI agents
//   sitemap.xml — for search engines (referenced from robots.txt)
// Runs automatically before `pnpm build`.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { site, social } from "../src/lib/site.ts";
import { work } from "../src/lib/work.ts";

const root = resolve(import.meta.dirname, "..");
const url = (href: string) => new URL(href, site.url).toString();

const summary =
	`Personal portfolio of ${site.name}, a staff/senior fullstack engineer ` +
	"and founder who builds agentic, AI-native products. The site shares " +
	"his CV, the stack he works with, and his work";

const intro =
	`${site.name} is open to staff/senior fullstack engineering work on ` +
	"agentic and ML applications (fulltime, remote, Americas). He has " +
	"scaled infrastructure past $10M ARR, grown a team to over 20 " +
	"engineers, and loves taking products from zero to one. Outside of " +
	"work: travel (~30 countries), sailing, motorcycling, splitboarding, " +
	"chess and reading.";

const socialNotes: Record<string, string> = {
	LinkedIn: "Professional profile and contact",
	GitHub: "Code and open-source work",
	YouTube: "Videos",
	Substack: "Newsletter: new work and writing by email",
};

const lines = [
	`# ${site.name}`,
	"",
	`> ${summary}`,
	"",
	intro,
	"",
	"## About",
	"",
	`- [Home](${url("/")}): About Benjamin, what he is looking for, and featured work`,
	`- [Stack](${url("/stack")}): Technologies and tools he works with, grouped by area`,
	`- [CV](${url("/cv")}): CV page; a PDF version is at [cv.pdf](${url("/cv.pdf")})`,
	"",
	"## Portfolio",
	"",
	...work.map((w) => `- [${w.title}](${url(w.href)}): ${w.summary}`),
	`- [Portfolio](${url("/portfolio")}): All of the above, with pictures`,
	"",
	"## Elsewhere",
	"",
	...social.map(
		(s) =>
			`- [${s.label}](${s.href})${socialNotes[s.label] ? `: ${socialNotes[s.label]}` : ""}`,
	),
	"",
	"## Optional",
	"",
	`- [AI catalog](${url("/.well-known/ai-catalog.json")}): Machine-readable capability manifest (ARD spec)`,
	"",
];

writeFileSync(resolve(root, "public/llms.txt"), lines.join("\n"));
console.log(`Generated public/llms.txt (${work.length} portfolio entries)`);

// --- sitemap.xml -----------------------------------------------------------

// Deterministic (newest content date) so regenerating never dirties the tree
const today = work
	.map((e) => e.date)
	.sort()
	.at(-1);
const sitemapEntries = [
	{ path: "/", lastmod: today },
	{ path: "/portfolio", lastmod: today },
	...work
		.filter((w) => w.href.startsWith("/"))
		.map((w) => ({ path: w.href, lastmod: w.date })),
	{ path: "/cv", lastmod: today },
	{ path: "/stack", lastmod: today },
];

const sitemap = [
	'<?xml version="1.0" encoding="UTF-8"?>',
	'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
	...sitemapEntries.map(
		({ path, lastmod }) =>
			`\t<url><loc>${url(path)}</loc><lastmod>${lastmod}</lastmod></url>`,
	),
	"</urlset>",
	"",
];

writeFileSync(resolve(root, "public/sitemap.xml"), sitemap.join("\n"));
console.log(`Generated public/sitemap.xml (${sitemapEntries.length} pages)`);
