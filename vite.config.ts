import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { PageFileSystemRouter } from "filesystem-routing";
import { fileRoutes } from "filesystem-routing/vite";
import { prerender } from "prerender-crawler/vite";
import { defineConfig } from "vite";
import { typstCv } from "./plugins/typst-cv.ts";

// Folders prefixed with `-` co-locate components with their routes without
// becoming routes themselves.
class ColocatingRouter extends PageFileSystemRouter {
	constructor(
		config: ConstructorParameters<typeof PageFileSystemRouter>[0],
		private readonly exclude?: (src: string) => boolean,
	) {
		super(config);
	}

	override isRoute(src: string) {
		return (
			super.isRoute(src) &&
			!/\/-[^/]*\//.test(src.slice(this.config.dir.length)) &&
			!this.exclude?.(src)
		);
	}
}

export default defineConfig(({ command }) => {
	// The thumbnail stage only exists for `pnpm thumbnails`, which renders it through
	// the dev server. It is never prerendered, so it would only 404 in production —
	// keep it out of production builds entirely.
	const devOnlyRoutes = (src: string) =>
		command === "build" && src.endsWith("/thumbnail.tsx");

	return {
		resolve: {
			dedupe: ["solid-js", "@solidjs/web", "@solidjs/router", "@solidjs/meta"],
			alias: { "~": new URL("./src", import.meta.url).pathname },
		},
		plugins: [
			typstCv(),
			tailwindcss(),
			// `extensions` lets the Solid compiler handle the `?pick=` route modules
			solid({
				start: true,
				ssr: true,
				extensions: [".tsx"],
			}),
			fileRoutes({
				router: new ColocatingRouter(
					{
						dir: new URL("./src/routes", import.meta.url).pathname,
						extensions: ["tsx"],
					},
					devOnlyRoutes,
				),
			}),
			// Every page is rendered at build time (the SSR build runs in-process, in Node);
			// dist/client is the whole deployment: static assets, no Worker code.
			prerender({
				mode: "static",
				// /cv → cv.html, not cv/index.html: static hosts then serve /cv as-is,
				// matching the canonical URLs, instead of redirecting it to /cv/.
				autoSubfolderIndex: false,
				// Nothing links to the catch-all, so seed it for Cloudflare's 404 handler.
				pages: ["/", { path: "/404", filename: "404.html" }],
				// Links to static files in public/ (e.g. /cv.pdf) are not pages.
				filter: (path) => !/\.[a-z0-9]+$/i.test(path),
			}),
		],
	};
});
