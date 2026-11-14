// Writes cv/linkedin.md: the CV's work experience, open source and projects,
// laid out as LinkedIn's profile form fields for copy-pasting by hand.
// Reads the `metadata(...) <cv>` tags in cv/cv.typ through `typst eval`.
// Usage: node scripts/linkedin.ts

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SOURCE = "cv/cv.typ";
const OUT = "cv/linkedin.md";
/** LinkedIn's limit on Experience and Project descriptions. */
const DESCRIPTION_LIMIT = 2000;

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
			skills: string[];
	  };

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

/** LinkedIn allows 5 skills per position or project. */
const SKILL_LIMIT = 5;

function skills(e: Extract<Tag, { kind: "entry" }>): string {
	if (e.skills.length === 0) return "";
	const over =
		e.skills.length > SKILL_LIMIT
			? ` (${e.skills.length}/${SKILL_LIMIT}, over the limit)`
			: "";
	return `- **Skills${over}:** ${e.skills.join(", ")}`;
}

function experience(e: Extract<Tag, { kind: "entry" }>): string {
	const [start, end] = text(e.aside)
		.split(/\s*[—–-]\s*/)
		.map((s) => s.trim());
	const location = text(e.aside2);
	const out = [
		`### ${text(e.title)} — ${text(e.sub)}\n`,
		`- **Title:** ${text(e.title)}`,
		`- **Company:** ${text(e.sub)}`,
		location === "Remote"
			? "- **Location type:** Remote"
			: `- **Location:** ${location}`,
		`- **Start date:** ${start}`,
		`- **End date:** ${end && end !== "Present" ? end : "(currently working here)"}`,
		skills(e),
		"",
		describe(e.bullets.map(text)),
	];
	return out.join("\n");
}

function project(e: Extract<Tag, { kind: "entry" }>): string {
	const role = text(e.sub);
	const url = href(e.aside);
	const out = [
		`### ${text(e.title)}\n`,
		`- **Project name:** ${text(e.title)}`,
		url ? `- **Link (add under Media):** ${url}` : "",
		skills(e),
		"",
		describe([...(role ? [`${role}.`] : []), ...e.bullets.map(text)]),
	];
	return out.filter((l, i) => l !== "" || i === out.length - 2).join("\n");
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

	const parts = [
		"# LinkedIn copy\n",
		`<!-- Generated from ${SOURCE} by scripts/linkedin.ts; don't edit by hand. -->\n`,
		"Fields for the LinkedIn profile forms, newest first, in the same order as the CV.\n",
	];
	let section: (typeof SECTIONS)[string] | undefined;
	for (const tag of tags) {
		if (tag.kind === "section") {
			section = SECTIONS[tag.title];
			if (section) parts.push(`## ${section.heading}\n`, `_${section.note}_\n`);
		} else if (section) {
			parts.push(section.render(tag));
		}
	}
	const md = `${parts.join("\n").trimEnd()}\n`;
	writeFileSync(`${root}/${OUT}`, md);
	return OUT;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	console.log(`wrote ${linkedin()}`);
}
