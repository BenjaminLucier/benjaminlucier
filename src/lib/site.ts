import { siGithub, siSubstack, siYoutube } from "simple-icons";

export const site = {
	name: "Benjamin Lucier",
	/** Meta/og description fallback for pages without one; 120–125 chars keeps
	 * it inside both the SERP (120–160) and social-preview (~125) windows. */
	seoDescription:
		"Benjamin Lucier, fullstack ML engineer: products, open source, CV and stack, from Rust and Python backends to TypeScript UIs.",
	url: "https://benjaminlucier.com",
	/** Substack publication; the signup card links to its subscribe page.
	 * Swap for a custom domain (e.g. a benjaminlucier.com subdomain) once it's set up. */
	newsletter: "https://benjaminlucier.substack.com",
	/** This site's source, linked from the footer. */
	source: "https://github.com/BenjaminLucier/benjaminlucier",
};

export const nav = [
	{ href: "/", label: "About" },
	{ href: "/portfolio", label: "Portfolio" },
	{ href: "/cv", label: "CV" },
	{ href: "/stack", label: "Stack" },
] as const;

// simple-icons dropped LinkedIn, so its 24x24 glyph path is inlined here.
const linkedinPath =
	"M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";

export const social = [
	{
		href: "https://www.linkedin.com/in/benjaminlucier",
		label: "LinkedIn",
		path: linkedinPath,
		color: "#0A66C2",
	},
	{
		href: "https://github.com/benjaminlucier",
		label: "GitHub",
		path: siGithub.path,
		// GitHub's brand colour is near-black, which vanishes on the dark theme.
		color: "var(--color-ink)",
	},
	{
		href: "https://www.youtube.com/@benjaminlucier",
		label: "YouTube",
		path: siYoutube.path,
		color: `#${siYoutube.hex}`,
	},
	{
		href: site.newsletter,
		label: "Substack",
		path: siSubstack.path,
		color: `#${siSubstack.hex}`,
	},
] as const;
