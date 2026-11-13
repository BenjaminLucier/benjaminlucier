// Fails if any work entry is missing a thumbnail in public/, the site image is
// missing its social image, or the favicon is missing. Run via `pnpm check:thumbnails`.
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
	ogSrc,
	SITE_IMAGE,
	THUMBNAIL_MODES,
	THUMBNAIL_VARIANT_WIDTHS,
	type ThumbnailKind,
	thumbnailSrc,
} from "../src/lib/thumbnails.ts";
import { work } from "../src/lib/work.ts";

const root = resolve(import.meta.dirname, "..");
const entries = work.map((w) => ({
	kind: "work" as ThumbnailKind,
	slug: w.slug,
}));
const missing = [
	// The favicon is rendered from the portfolio's circumpunct scene.
	"/favicon.ico",
	"/apple-touch-icon.png",
	...entries.flatMap(({ kind, slug }) => [
		...THUMBNAIL_MODES.flatMap((mode) => [
			thumbnailSrc(kind, slug, mode),
			...THUMBNAIL_VARIANT_WIDTHS.map((width) =>
				thumbnailSrc(kind, slug, mode, width),
			),
		]),
	]),
	ogSrc(SITE_IMAGE.kind, SITE_IMAGE.slug),
].filter((src) => !existsSync(resolve(root, `public${src}`)));

if (missing.length > 0) {
	console.error(
		`Missing thumbnails (run \`pnpm thumbnails\`):\n  ${missing.join("\n  ")}`,
	);
	process.exit(1);
}
