// Statically verifies the SEO/social meta tags of every page prerendered into
// dist/client, mirroring a meta-tag audit: title and description lengths,
// twitter:card, og:image presence and dimensions. Run after `pnpm build`
// (`just deploy` wires this up).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { site } from "../src/lib/site.ts";
import { IMAGE_HEIGHT, IMAGE_WIDTH } from "../src/lib/thumbnails.ts";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist/client");

/** Audit thresholds: SERP snippets cut off around 60 (title) and 160
 * (description) characters; social previews truncate near 125. */
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 120;
const DESCRIPTION_MAX = 160;
const SOCIAL_DESCRIPTION_MAX = 125;

if (!existsSync(dist)) {
	console.error("dist/client not found — run `pnpm build` first");
	process.exit(1);
}

/** Every prerendered page, as dist-relative HTML paths. */
const htmlFiles = readdirSync(dist, { recursive: true })
	.map((file) => String(file).replaceAll("\\", "/"))
	.filter((file) => file.endsWith(".html"))
	.sort();

/** The page path a prerendered HTML file was rendered for. */
const pagePath = (file: string) =>
	file === "index.html"
		? "/"
		: `/${file.replace(/\/index\.html$/, "").replace(/\.html$/, "")}`;

/** Meta tags and links of one page, keyed by name/property/rel. */
function headOf(html: string) {
	const meta = new Map<string, string>();
	for (const tag of html.matchAll(/<meta\b[^>]*>/g)) {
		const attrs = new Map(
			[...tag[0].matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)].map((m) => [
				m[1],
				m[2],
			]),
		);
		const key = attrs.get("name") ?? attrs.get("property");
		const content = attrs.get("content");
		if (key && content) meta.set(key, content);
	}
	const links = new Map<string, string>();
	for (const tag of html.matchAll(/<link\b[^>]*>/g)) {
		const attrs = new Map(
			[...tag[0].matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)].map((m) => [
				m[1],
				m[2],
			]),
		);
		const rel = attrs.get("rel");
		const href = attrs.get("href");
		if (rel && href) links.set(rel, href);
	}
	const title = html.match(/<title\b[^>]*>([^<]*)<\/title>/)?.[1];
	return { meta, links, title };
}

/** Prerendered HTML escapes `&` etc.; audits measure the decoded text. */
const ENTITIES: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	"#39": "'",
	"#x27": "'",
	nbsp: " ",
};
const decode = (text: string) =>
	text.replace(
		/&(amp|lt|gt|quot|nbsp|#39|#x27);/g,
		(_, entity) => ENTITIES[entity] ?? _,
	);

/** PNG pixel dimensions, from the IHDR chunk every PNG starts with. */
function pngSize(file: string): [number, number] | undefined {
	const png = readFileSync(file);
	if (png.subarray(1, 4).toString() !== "PNG") return;
	const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
	return [view.getUint32(16), view.getUint32(20)];
}

let failures = 0;
for (const file of htmlFiles) {
	const path = pagePath(file);
	const { meta, links, title } = headOf(readFileSync(join(dist, file), "utf8"));
	const problems: string[] = [];
	const check = (ok: boolean, message: string) => {
		if (!ok) problems.push(message);
	};
	const decoded = (key: string) => decode(meta.get(key) ?? "");
	const length = (key: string) => decoded(key).length;

	const pageTitle = decode(title ?? "");
	check(title !== undefined, "title: missing");
	check(
		title !== undefined && pageTitle.length <= TITLE_MAX,
		`title: ${pageTitle.length} chars (max ${TITLE_MAX})`,
	);

	const ogTitle = decoded("og:title");
	check(meta.has("og:title"), "og:title: missing");
	check(
		meta.has("og:title") && ogTitle.length <= TITLE_MAX,
		`og:title: ${ogTitle.length} chars (max ${TITLE_MAX})`,
	);
	check(!title || ogTitle === pageTitle, "og:title: differs from <title>");

	check(meta.has("description"), "description: missing");
	check(
		meta.has("description") &&
			length("description") >= DESCRIPTION_MIN &&
			length("description") <= DESCRIPTION_MAX,
		`description: ${length("description")} chars (want ${DESCRIPTION_MIN}-${DESCRIPTION_MAX})`,
	);

	for (const key of ["og:description", "twitter:description"]) {
		check(meta.has(key), `${key}: missing`);
		check(
			meta.has(key) && length(key) <= SOCIAL_DESCRIPTION_MAX,
			`${key}: ${length(key)} chars (max ${SOCIAL_DESCRIPTION_MAX})`,
		);
	}

	check(
		meta.get("twitter:card") === "summary_large_image",
		`twitter:card: ${meta.get("twitter:card") ?? "missing"} (want summary_large_image)`,
	);
	for (const key of ["twitter:title", "twitter:image", "og:site_name"]) {
		check(meta.has(key), `${key}: missing`);
	}

	const ogUrl = meta.get("og:url");
	const expectedUrl = `${site.url}${path === "/" ? "" : path}`;
	check(
		ogUrl === expectedUrl,
		`og:url: ${ogUrl ?? "missing"} (want ${expectedUrl})`,
	);
	check(
		links.get("canonical") === expectedUrl,
		`canonical: ${links.get("canonical") ?? "missing"} (want ${expectedUrl})`,
	);

	const ogImage = meta.get("og:image");
	const imagePath = ogImage?.startsWith(`${site.url}/`)
		? ogImage.slice(site.url.length)
		: undefined;
	const imageFile = imagePath && resolve(dist, `.${imagePath}`);
	if (!ogImage || !imagePath || !imageFile || !existsSync(imageFile)) {
		problems.push(`og:image: ${ogImage ?? "missing"} (not in dist/client)`);
	} else {
		const size = pngSize(imageFile);
		check(
			size !== undefined,
			"og:image: not a decodable PNG (platforms expect image/png)",
		);
		check(
			size?.[0] === IMAGE_WIDTH && size?.[1] === IMAGE_HEIGHT,
			`og:image: ${size?.[0]}x${size?.[1]} (want ${IMAGE_WIDTH}x${IMAGE_HEIGHT})`,
		);
		check(
			meta.get("og:image:width") === String(IMAGE_WIDTH) &&
				meta.get("og:image:height") === String(IMAGE_HEIGHT),
			`og:image:width/height tags: ${meta.get("og:image:width")}x${meta.get("og:image:height")} (want ${IMAGE_WIDTH}x${IMAGE_HEIGHT})`,
		);
	}

	check(
		meta.get("og:type") === "website",
		`og:type: ${meta.get("og:type") ?? "missing"}`,
	);

	if (problems.length > 0) {
		failures++;
		console.error(`✗ ${path}\n  ${problems.join("\n  ")}`);
	}
}

if (failures > 0) {
	console.error(
		`\n${failures} of ${htmlFiles.length} pages failed the meta audit`,
	);
	process.exit(1);
}
console.log(`Meta audit passed: ${htmlFiles.length} pages checked`);
