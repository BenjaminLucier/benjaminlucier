// Shared plumbing for scripts that crawl the built site in dist/client:
// a static file server and the route list, sourced from the generated
// sitemap.xml so every consumer tests exactly what crawlers are told to crawl.
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join } from "node:path";

export const ROOT = new URL("../../dist/client", import.meta.url).pathname;

const MIME = {
	".html": "text/html",
	".js": "text/javascript",
	".css": "text/css",
	".png": "image/png",
	".jpg": "image/jpeg",
	".svg": "image/svg+xml",
	".woff2": "font/woff2",
	".json": "application/json",
	".xml": "application/xml",
	".txt": "text/plain",
	".webp": "image/webp",
	".pdf": "application/pdf",
};

/** Serves dist/client like the production asset handler would, including the 404 page. */
export function serveDist(port = 4199) {
	const server = createServer(async (req, res) => {
		const url = new URL(req.url ?? "/", "http://x");
		const tryPaths = url.pathname.endsWith("/")
			? [join(ROOT, url.pathname, "index.html")]
			: [
					join(ROOT, url.pathname),
					// Pages are written flat (/cv → cv.html), as the static host serves them.
					join(ROOT, `${url.pathname}.html`),
					join(ROOT, url.pathname, "index.html"),
				];
		for (const path of tryPaths) {
			try {
				const body = await readFile(path);
				res.setHeader(
					"content-type",
					MIME[extname(path)] ?? "application/octet-stream",
				);
				res.end(body);
				return;
			} catch {}
		}
		try {
			const body = await readFile(join(ROOT, "404.html"));
			res.setHeader("content-type", "text/html");
			res.statusCode = 404;
			res.end(body);
		} catch {
			res.statusCode = 500;
			res.end("nope");
		}
	});
	return new Promise((ok) => server.listen(port, () => ok(server)));
}

/**
 * Every crawlable route: the paths advertised in dist/client/sitemap.xml (written by
 * `pnpm discovery` during the build) plus the prerendered 404 page. Requires a build.
 */
export async function crawlRoutes() {
	const sitemap = await readFile(join(ROOT, "sitemap.xml"), "utf8");
	const paths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
		(m) => new URL(m[1]).pathname,
	);
	if (paths.length === 0)
		throw new Error("sitemap.xml has no <loc> entries; run the build first");
	return [...paths, "/404.html"];
}
