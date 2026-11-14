// Writes cv/linkedin.md: the CV's work experience, open source and projects,
// laid out as LinkedIn's profile form fields for copy-pasting by hand.
// Reads the `metadata(...) <cv>` tags in cv/cv.typ through `typst eval`, and
// the About text from src/lib/about.ts, which the home page also renders.
// Usage: node scripts/linkedin.ts

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { about, headline, plain } from "../src/lib/about.ts";

const SOURCE = "cv/cv.typ";
const OUT = "cv/linkedin.md";
/** LinkedIn's limit on Experience and Project descriptions. */
const DESCRIPTION_LIMIT = 2000;
/** LinkedIn's limit on the headline. */
const HEADLINE_LIMIT = 220;
/** LinkedIn's limit on the About section. */
const ABOUT_LIMIT = 2600;

/** Typst content as `typst eval` serializes it. */
type Content =
	| string
	| {
			func: string;
			text?: string;
			body?: Content;
			dest?: string;
			children?: Content[];
			double?: boolean;
	  };

type Tag =
	| { kind: "section"; title: string }
	| {
			kind: "entry";
			title: Content;
			aside: Content;
			sub: Content;
			aside2: Content;
			bullets: Content[];
			/** False leaves the entry out; a Job lists it under Experience. */
			linkedin: boolean | Job;
	  }
	| {
			kind: "career-break";
			type: string;
			start: string;
			end: string;
			highlights: Content[];
	  };

type Entry = Extract<Tag, { kind: "entry" }>;

/** A CV project listed as a LinkedIn position, with the project as the company. */
interface Job {
	title: string;
	start: string;
	end: string;
}

/** The fields of a LinkedIn position. */
interface Position {
	title: string;
	company: string;
	location: string;
	start: string;
	end: string;
	url?: string | undefined;
	bullets: string[];
}

/** Flattens content to plain text, since LinkedIn fields take no formatting. */
function text(c: Content): string {
	if (typeof c === "string") return c;
	switch (c.func) {
		case "text":
		case "raw":
		case "symbol":
			return c.text ?? "";
		case "space":
			return " ";
		case "linebreak":
			return "\n";
		case "smartquote":
			return c.double === false ? "'" : '"';
		case "sequence":
			return (c.children ?? []).map(text).join("");
		default:
			// link, strong, emph and similar wrap a body.
			return c.body ? text(c.body) : "";
	}
}

/** The URL of a link, if the content is (or wraps) one. */
function href(c: Content): string | undefined {
	if (typeof c === "string") return undefined;
	if (c.func === "link") return c.dest;
	return (c.children ?? []).map(href).find(Boolean);
}

function description(lines: string[]): string {
	return lines.map((l) => `• ${l}`).join("\n");
}

/** A plain-text field, fenced so it copies cleanly. */
function field(name: string, value: string): string {
	return `${name}:\n\n\`\`\`text\n${value}\n\`\`\`\n`;
}

function describe(lines: string[]): string {
	const body = description(lines);
	const note =
		body.length > DESCRIPTION_LIMIT
			? ` (${body.length}/${DESCRIPTION_LIMIT}, over the limit)`
			: ` (${body.length}/${DESCRIPTION_LIMIT})`;
	return field(`Description${note}`, body);
}

function position(p: Position): string {
	const out = [
		`### ${p.title} — ${p.company}\n`,
		`- **Title:** ${p.title}`,
		`- **Company:** ${p.company}`,
	];
	if (p.location === "Remote") out.push("- **Location type:** Remote");
	else if (p.location) out.push(`- **Location:** ${p.location}`);
	out.push(
		`- **Start date:** ${p.start}`,
		`- **End date:** ${p.end !== "Present" ? p.end : "(currently working here)"}`,
	);
	if (p.url) out.push(`- **Link (add under Media):** ${p.url}`);
	out.push("", describe(p.bullets));
	return out.join("\n");
}

function experience(e: Entry): string {
	const [start = "", end = "Present"] = text(e.aside)
		.split(/\s*[—–-]\s*/)
		.map((s) => s.trim());
	return position({
		title: text(e.title),
		company: text(e.sub),
		location: text(e.aside2),
		start,
		end,
		bullets: e.bullets.map(text),
	});
}

/** A CV project as a LinkedIn position; its role line becomes the title. */
function job(e: Entry, j: Job): string {
	return position({
		...j,
		company: text(e.title),
		location: "",
		url: href(e.aside),
		bullets: e.bullets.map(text),
	});
}

function project(e: Entry): string {
	const role = text(e.sub);
	const url = href(e.aside);
	const out = [
		`### ${text(e.title)}\n`,
		`- **Project name:** ${text(e.title)}`,
		url ? `- **Link (add under Media):** ${url}` : "",
		"",
		describe([...(role ? [`${role}.`] : []), ...e.bullets.map(text)]),
	];
	return out.filter((l, i) => l !== "" || i === out.length - 2).join("\n");
}

function headlineSection(): string {
	const note =
		headline.length > HEADLINE_LIMIT
			? `${headline.length}/${HEADLINE_LIMIT}, over the limit`
			: `${headline.length}/${HEADLINE_LIMIT}`;
	return [
		"## Headline\n",
		"_Profile → edit intro (pencil by your name)._\n",
		field(`Headline (${note})`, headline),
	].join("\n");
}

function aboutSection(): string {
	const body = about.map(plain).join("\n\n");
	const note =
		body.length > ABOUT_LIMIT
			? `${body.length}/${ABOUT_LIMIT}, over the limit`
			: `${body.length}/${ABOUT_LIMIT}`;
	return [
		"## About\n",
		"_Profile → About → edit (pencil)._\n",
		field(`About (${note})`, body),
	].join("\n");
}

function careerBreak(b: Extract<Tag, { kind: "career-break" }>): string {
	const body = description(b.highlights.map(text));
	const out = [
		"### Career break\n",
		"_Profile → Add profile section → Add career break._\n",
		`- **Type:** ${b.type}`,
		`- **Start date:** ${b.start}`,
		`- **End date:** ${b.end}`,
		"",
		field(`Description (${body.length} characters)`, body),
	];
	return out.join("\n");
}

const SECTIONS: Record<
	string,
	{ heading: string; note: string; render: typeof experience }
> = {
	"Work Experience": {
		heading: "Experience",
		note: "Profile → Add profile section → Add position.",
		render: experience,
	},
	"Open Source": {
		heading: "Open Source",
		note: "Profile → Add profile section → Add projects.",
		render: project,
	},
	Projects: {
		heading: "Projects",
		note: "Profile → Add profile section → Add projects.",
		render: project,
	},
};

export function linkedin(root = process.cwd()): string {
	const json = execFileSync(
		"typst",
		["eval", "--root", root, "--in", SOURCE, "query(<cv>).map(it => it.value)"],
		{ cwd: root, encoding: "utf8" },
	);
	const tags = JSON.parse(json) as Tag[];

	// Rendered entries per LinkedIn heading, in CV order. Projects marked as
	// jobs go to the top of Experience, since they're the most recent.
	const sections = new Map<string, { note: string; items: string[] }>();
	const jobs: string[] = [];
	let section: (typeof SECTIONS)[string] | undefined;
	for (const tag of tags) {
		if (tag.kind === "section") {
			section = SECTIONS[tag.title];
			if (section && !sections.has(section.heading))
				sections.set(section.heading, { note: section.note, items: [] });
		} else if (tag.kind === "career-break") {
			sections.get(section?.heading ?? "")?.items.push(careerBreak(tag));
		} else if (typeof tag.linkedin === "object") {
			jobs.push(job(tag, tag.linkedin));
		} else if (section && tag.linkedin) {
			sections.get(section.heading)?.items.push(section.render(tag));
		}
	}
	sections.get("Experience")?.items.unshift(...jobs);

	const parts = [
		"# LinkedIn copy\n",
		`<!-- Generated from ${SOURCE} by scripts/linkedin.ts; don't edit by hand. -->\n`,
		"Fields for the LinkedIn profile forms, newest first, in the same order as the CV.\n",
	];
	parts.push(headlineSection(), aboutSection());
	for (const [heading, { note, items }] of sections) {
		if (items.length > 0)
			parts.push(`## ${heading}\n`, `_${note}_\n`, ...items);
	}
	const md = `${parts.join("\n").trimEnd()}\n`;
	writeFileSync(`${root}/${OUT}`, md);
	return OUT;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	console.log(`wrote ${linkedin()}`);
}
