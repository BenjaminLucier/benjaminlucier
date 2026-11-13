// Renders every `{ scene }` thumbnail and converts every `{ image }` thumbnail into
//   public/<kind>-thumbnails/<slug>-<light|dark>.webp           (card image, 1200w)
//   public/<kind>-thumbnails/<slug>-<light|dark>-<480|800>.webp  (card image, srcSet)
//   public/<kind>-og/<slug>.png                                  (social preview, dark,
//                                                                 title + CTA overlay)
//   public/favicon.ico + public/apple-touch-icon.png             (site favicon, dark,
//                                                                  cropped from the
//                                                                  portfolio's scene)
// The stage is rendered once per theme at twice the density; every size is encoded
// from that one capture. Run with `pnpm thumbnails [slug]`.
import { Buffer } from "node:buffer";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { chromium, type Page } from "playwright";
import { createServer } from "vite";
import {
	IMAGE_HEIGHT,
	IMAGE_WIDTH,
	ogSrc,
	SITE_IMAGE,
	THUMBNAIL_HEIGHT,
	THUMBNAIL_MODES,
	THUMBNAIL_VARIANT_WIDTHS,
	THUMBNAIL_WIDTH,
	type Thumbnail,
	type ThumbnailKind,
	type ThumbnailMode,
	thumbnailSrc,
} from "../src/lib/thumbnails.ts";
import { work } from "../src/lib/work.ts";

const root = resolve(import.meta.dirname, "..");
const only = process.argv[2];
/** Overridable so another process squatting on the default doesn't block a run. */
// Preferred port; Vite moves to the next free one if it is taken.
const PORT = Number(process.env.THUMBNAILS_PORT) || 5199;
/** WebP quality, 0 to 1. */
const QUALITY = 0.92;
/** The theme the social image is shown in. */
const OG_MODE: ThumbnailMode = "dark";

type Entry = { kind: ThumbnailKind; slug: string; thumbnail: Thumbnail };
const entries: Entry[] = work
	.map((w) => ({ kind: "work" as const, ...w }))
	.filter((e) => !only || e.slug === only);

if (only && entries.length === 0) {
	console.error(`No work entry with slug "${only}".`);
	process.exit(1);
}

/** One file to write. */
type Output = {
	label: string;
	src: string;
	mode: ThumbnailMode;
	type: "image/webp" | "image/png" | "image/x-icon";
	width: number;
	height: number;
	/** Written as a raw stage capture (the social image) instead of re-encoded. */
	raw?: boolean;
};

const webpOutput = (
	kind: ThumbnailKind,
	slug: string,
	mode: ThumbnailMode,
	width: number,
): Output => ({
	label:
		width === IMAGE_WIDTH
			? `${kind}/${slug}-${mode}`
			: `${kind}/${slug}-${mode}-${width}`,
	src: thumbnailSrc(kind, slug, mode, width),
	mode,
	type: "image/webp",
	width,
	height: Math.round((width / IMAGE_WIDTH) * IMAGE_HEIGHT),
});

/** The site image's scene doubles as the favicon, in the social theme. */
const isSiteImage = (kind: ThumbnailKind, slug: string) =>
	kind === SITE_IMAGE.kind && slug === SITE_IMAGE.slug;

const faviconOutput = (
	size: number,
	type: "image/png" | "image/x-icon",
	src: string,
): Output => ({
	label: `favicon-${size}`,
	src,
	mode: OG_MODE,
	type,
	width: size,
	height: size,
});

const ogOutput = (kind: ThumbnailKind, slug: string): Output => ({
	label: `${kind}/${slug}-og`,
	src: ogSrc(kind, slug),
	mode: OG_MODE,
	type: "image/png",
	width: IMAGE_WIDTH,
	height: IMAGE_HEIGHT,
	raw: true,
});

const outputsFor = ({ kind, slug }: Entry): Output[] => [
	...THUMBNAIL_MODES.flatMap((mode) => [
		...THUMBNAIL_VARIANT_WIDTHS.map((width) =>
			webpOutput(kind, slug, mode, width),
		),
		webpOutput(kind, slug, mode, IMAGE_WIDTH),
	]),
	// The site image stands in as the social preview for every page.
	...(isSiteImage(kind, slug) ? [ogOutput(kind, slug)] : []),
	...(isSiteImage(kind, slug)
		? [
				faviconOutput(32, "image/x-icon", "/favicon.ico"),
				faviconOutput(180, "image/png", "/apple-touch-icon.png"),
			]
		: []),
];

const failures: string[] = [];

const MIME: Record<string, string> = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
};

/**
 * Re-encodes an image as `type` at width x height (cover-fit), using the browser's own
 * encoder so no image library is needed.
 */
async function encode(
	page: Page,
	bytes: Uint8Array,
	mime: string,
	{ type, width, height }: Pick<Output, "type" | "width" | "height">,
) {
	const encoded = await page.evaluate(
		async ({ base64, mime, type, width, height, quality }) => {
			const image = new Image();
			image.src = `data:${mime};base64,${base64}`;
			await image.decode();
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			const scale = Math.max(width / image.width, height / image.height);
			const w = image.width * scale;
			const h = image.height * scale;
			canvas
				.getContext("2d")
				?.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
			return canvas.toDataURL(type, quality).split(",")[1] ?? "";
		},
		{
			base64: Buffer.from(bytes).toString("base64"),
			mime,
			type,
			width,
			height,
			quality: QUALITY,
		},
	);
	return Buffer.from(encoded, "base64");
}

function write(output: Output, bytes: Uint8Array) {
	const target = resolve(root, `public${output.src}`);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, bytes);
	console.log(`wrote ${output.label}`);
}

/** Wraps a PNG in a single-image ICO container, the format browsers expect at /favicon.ico. */
function ico(png: Buffer, size: number): Buffer {
	const header = Buffer.alloc(6 + 16);
	header.writeUInt16LE(0, 0); // reserved
	header.writeUInt16LE(1, 2); // type: icon
	header.writeUInt16LE(1, 4); // image count
	header.writeUInt8(size, 6); // width (0 would mean 256)
	header.writeUInt8(size, 7); // height
	header.writeUInt16LE(1, 10); // planes
	header.writeUInt16LE(32, 12); // bits per pixel
	header.writeUInt32LE(png.length, 14);
	header.writeUInt32LE(header.length, 18); // the PNG starts after the directory
	return Buffer.concat([header, png]);
}

// Set once the dev server is listening, on whichever port Vite settled on.
let baseUrl = "";

/** Screenshots the stage for one entry, optionally with the social overlay. */
async function captureStage(
	page: Page,
	entry: Entry,
	mode: ThumbnailMode,
	social = false,
): Promise<Buffer> {
	await page.goto(
		`${baseUrl}/thumbnail?kind=${entry.kind}&slug=${entry.slug}&mode=${mode}${social ? "&social=1" : ""}`,
	);
	const stage = page.locator("#thumbnail-stage");
	await stage.and(page.locator("[data-ready], [data-error]")).waitFor({
		timeout: 30_000,
	});
	const error = await stage.getAttribute("data-error");
	if (error !== null) throw new Error(error);
	return stage.screenshot({ type: "png" });
}

const server = await createServer({
	root,
	logLevel: "error",
	server: { port: PORT },
});
await server.listen();
baseUrl = `http://localhost:${server.config.server.port}`;
const browser = await chromium.launch();
try {
	// Wider and taller than the stage, so a scrollbar never clips the capture.
	const viewport = {
		width: THUMBNAIL_WIDTH + 100,
		height: THUMBNAIL_HEIGHT + 100,
	};
	const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
	const converter = await browser.newPage();

	for (const entry of entries) {
		const { thumbnail } = entry;
		const outputs = outputsFor(entry);
		for (const mode of THUMBNAIL_MODES) {
			const modeOutputs = outputs.filter((o) => o.mode === mode);
			const ogOutput = modeOutputs.find((o) => o.raw);
			const cardOutputs = modeOutputs.filter((o) => !o.raw);

			// Card thumbnails and favicons: one capture per theme; every size is encoded
			// from it. One retry: the dev server occasionally reloads itself mid-render.
			for (let attempt = 1; attempt <= 2; attempt++) {
				try {
					let source: { bytes: Buffer; mime: string };
					if ("image" in thumbnail) {
						const path =
							typeof thumbnail.image === "string"
								? thumbnail.image
								: thumbnail.image[mode];
						const mime = MIME[extname(path).toLowerCase()];
						if (!mime) throw new Error(`unsupported image type: ${path}`);
						source = {
							bytes: readFileSync(resolve(root, path)),
							mime,
						};
					} else {
						source = {
							bytes: await captureStage(page, entry, mode),
							mime: "image/png",
						};
					}

					for (const output of cardOutputs) {
						if (output.type === "image/x-icon") {
							// The canvas encoder only speaks PNG, so the ICO wraps an encoded PNG.
							const png = await encode(converter, source.bytes, source.mime, {
								...output,
								type: "image/png",
							});
							write(output, ico(png, output.width));
						} else {
							write(
								output,
								await encode(converter, source.bytes, source.mime, output),
							);
						}
					}
					break;
				} catch (error) {
					if (attempt === 2) {
						failures.push(
							`${entry.kind}/${entry.slug}-${mode}: ${error instanceof Error ? error.message : error}`,
						);
					}
				}
			}

			// Social image: the stage again with the title + CTA overlay.
			if (ogOutput) {
				for (let attempt = 1; attempt <= 2; attempt++) {
					try {
						write(ogOutput, await captureStage(page, entry, mode, true));
						break;
					} catch (error) {
						if (attempt === 2) {
							failures.push(
								`${entry.kind}/${entry.slug}-og: ${error instanceof Error ? error.message : error}`,
							);
						}
					}
				}
			}
		}
	}
} finally {
	await browser.close();
	await server.close();
}

if (failures.length > 0) {
	console.error(
		`\n${failures.length} thumbnail(s) failed:\n  ${failures.join("\n  ")}`,
	);
	process.exit(1);
}
