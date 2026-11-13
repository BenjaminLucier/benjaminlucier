import { byMode, currentMode } from "~/lib/catppuccin";
import { mulberry32, type Rng } from "~/lib/rng";
import type { SceneSize } from "~/lib/thumbnail-scene";

export const generativeStyles = [
	"dither",
	"flow",
	"truchet",
	"harmonograph",
	"ridgelines",
	"voronoi",
] as const;
export type GenerativeStyle = (typeof generativeStyles)[number];

export type GenerativeSceneOptions = {
	seed?: number;
	/** Defaults to one of the styles, picked by the seed. */
	style?: GenerativeStyle;
};

/** Roles picked from the site's Catppuccin palette (lib/catppuccin.ts), per theme. */
const palettes = byMode((c) => ({
	background: c.base,
	nodes: [c.blue, c.sapphire, c.teal, c.lavender],
	pulse: c.mauve,
	link: c.overlay0,
}));

type Palette = (typeof palettes)["light" | "dark"];

const TAU = Math.PI * 2;

/** 8x8 Bayer matrix, values 0 to 63: the thresholds for ordered dithering. */
const BAYER = [
	[0, 32, 8, 40, 2, 34, 10, 42],
	[48, 16, 56, 24, 50, 18, 58, 26],
	[12, 44, 4, 36, 14, 46, 6, 38],
	[60, 28, 52, 20, 62, 30, 54, 22],
	[3, 35, 11, 43, 1, 33, 9, 41],
	[51, 19, 59, 27, 49, 17, 57, 25],
	[15, 47, 7, 39, 13, 45, 5, 37],
	[63, 31, 55, 23, 61, 29, 53, 21],
] as const;

/** A gradient from one corner towards the other, turned into dots by ordered dithering. */
function dither(
	ctx: CanvasRenderingContext2D,
	{ width, height }: SceneSize,
	palette: Palette,
	rng: Rng,
) {
	const block = 5;
	const angle = rng() * TAU;
	const dx = Math.cos(angle);
	const dy = Math.sin(angle);
	const reach = Math.abs(dx) * width + Math.abs(dy) * height;
	const color = palette.nodes[
		Math.floor(rng() * palette.nodes.length)
	] as string;

	ctx.fillStyle = color;
	for (let y = 0; y < height; y += block) {
		for (let x = 0; x < width; x += block) {
			// How far along the gradient this block is, 0 to 1.
			const t = ((x - width / 2) * dx + (y - height / 2) * dy) / reach + 0.5;
			const threshold =
				((BAYER[(y / block) % 8]?.[(x / block) % 8] ?? 0) + 0.5) / 64;
			if (t > threshold) ctx.fillRect(x, y, block, block);
		}
	}
}

/** Smooth value noise on a lattice of seeded random values, 0 to 1. */
function noise(rng: Rng) {
	const size = 32;
	const lattice = Array.from({ length: size * size }, rng);
	const at = (x: number, y: number) =>
		lattice[
			(((y % size) + size) % size) * size + (((x % size) + size) % size)
		] as number;
	const smooth = (t: number) => t * t * (3 - 2 * t);
	return (x: number, y: number) => {
		const x0 = Math.floor(x);
		const y0 = Math.floor(y);
		const tx = smooth(x - x0);
		const ty = smooth(y - y0);
		const top = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx;
		const bottom = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
		return top * (1 - ty) + bottom * ty;
	};
}

/** Lines that start at random points and follow a smooth, noisy field of directions. */
function flow(
	ctx: CanvasRenderingContext2D,
	{ width, height }: SceneSize,
	palette: Palette,
	rng: Rng,
) {
	const field = noise(rng);
	const scale = 0.006;
	ctx.lineWidth = 1.6;
	ctx.lineCap = "round";
	for (let line = 0; line < 420; line++) {
		let x = rng() * width;
		let y = rng() * height;
		ctx.strokeStyle = palette.nodes[line % palette.nodes.length] as string;
		ctx.globalAlpha = 0.35 + rng() * 0.5;
		ctx.beginPath();
		ctx.moveTo(x, y);
		for (let i = 0; i < 70; i++) {
			const angle = field(x * scale, y * scale) * TAU * 2;
			x += Math.cos(angle) * 3;
			y += Math.sin(angle) * 3;
			ctx.lineTo(x, y);
		}
		ctx.stroke();
	}
	ctx.globalAlpha = 1;
}

/** Square tiles, each holding two quarter-circle arcs turned a random way, which join into loops. */
function truchet(
	ctx: CanvasRenderingContext2D,
	{ width, height }: SceneSize,
	palette: Palette,
	rng: Rng,
) {
	const tile = 45;
	ctx.lineWidth = 5;
	ctx.lineCap = "butt";
	for (let row = 0; row * tile < height; row++) {
		for (let col = 0; col * tile < width; col++) {
			const x = col * tile;
			const y = row * tile;
			const flipped = rng() < 0.5;
			ctx.strokeStyle = (palette.nodes[(row + col) % 2] ??
				palette.link) as string;
			// Arcs centred on opposite corners; flipping swaps which pair of corners.
			const corners: [number, number, number][] = flipped
				? [
						[x, y, 0],
						[x + tile, y + tile, Math.PI],
					]
				: [
						[x + tile, y, Math.PI / 2],
						[x, y + tile, -Math.PI / 2],
					];
			for (const [cx, cy, from] of corners) {
				ctx.beginPath();
				ctx.arc(cx, cy, tile / 2, from, from + Math.PI / 2);
				ctx.stroke();
			}
		}
	}
}

/** A pendulum drawing machine: two damped sine waves per axis, traced as one fading curve. */
function harmonograph(
	ctx: CanvasRenderingContext2D,
	{ width, height }: SceneSize,
	palette: Palette,
	rng: Rng,
) {
	// Near-integer frequency ratios keep the figure looping; the detune makes it drift.
	const pendulum = () => ({
		frequency: 1 + Math.floor(rng() * 3) + (rng() - 0.5) * 0.02,
		phase: rng() * TAU,
		damping: 0.002 + rng() * 0.002,
	});
	const axis = [pendulum(), pendulum()];
	const yAxis = [pendulum(), pendulum()];
	const wave = (ps: typeof axis, t: number) =>
		ps.reduce(
			(sum, p) =>
				sum + Math.sin(p.frequency * t + p.phase) * Math.exp(-p.damping * t),
			0,
		) / ps.length;

	const steps = 12000;
	const step = 0.05;
	const chunk = 600;
	ctx.lineWidth = 1.2;
	ctx.lineJoin = "round";
	for (let start = 0; start < steps; start += chunk) {
		ctx.strokeStyle = palette.nodes[
			(start / chunk) % palette.nodes.length
		] as string;
		ctx.globalAlpha = 0.85 - (0.5 * start) / steps;
		ctx.beginPath();
		for (let i = start; i <= Math.min(start + chunk, steps); i++) {
			const t = i * step;
			const x = width / 2 + wave(axis, t) * width * 0.44;
			const y = height / 2 + wave(yAxis, t) * height * 0.44;
			if (i === start) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();
	}
	ctx.globalAlpha = 1;
}

/** Stacked noisy lines, each filled underneath so it hides the ridges behind it. */
function ridgelines(
	ctx: CanvasRenderingContext2D,
	{ width, height }: SceneSize,
	palette: Palette,
	rng: Rng,
) {
	const field = noise(rng);
	const rows = 22;
	const marginX = width * 0.12;
	const top = height * 0.2;
	const gap = (height * 0.72) / rows;
	const peak = height * 0.22;
	ctx.lineWidth = 1.6;
	ctx.lineJoin = "round";
	for (let row = 0; row < rows; row++) {
		const baseline = top + row * gap;
		const ridge = new Path2D();
		ridge.moveTo(marginX, baseline);
		for (let x = marginX; x <= width - marginX; x += 3) {
			// 0 at the edges, 1 in the middle: the peaks gather in the centre.
			const u = (x - marginX) / (width - 2 * marginX);
			const envelope = Math.exp(-((u - 0.5) ** 2) / 0.03);
			const lift = field(x * 0.02, row * 0.6) ** 3 * envelope;
			ridge.lineTo(x, baseline - lift * peak);
		}
		const below = new Path2D(ridge);
		below.lineTo(width - marginX, height);
		below.lineTo(marginX, height);
		below.closePath();
		ctx.fillStyle = palette.background;
		ctx.fill(below);
		ctx.strokeStyle = palette.nodes[row % palette.nodes.length] as string;
		ctx.stroke(ridge);
	}
}

type Point = [number, number];

/** Seeded points split the canvas into cells, each the area nearest its point. */
function voronoi(
	ctx: CanvasRenderingContext2D,
	{ width, height }: SceneSize,
	palette: Palette,
	rng: Rng,
) {
	// A jittered grid spreads the points more evenly than pure randomness.
	const cell = height / 4;
	const sites: Point[] = [];
	for (let y = 0; y < height; y += cell) {
		for (let x = 0; x < width; x += cell) {
			sites.push([x + rng() * cell, y + rng() * cell]);
		}
	}

	ctx.lineWidth = height * 0.012;
	ctx.lineJoin = "round";
	ctx.strokeStyle = palette.background;
	for (const site of sites) {
		// Start from the whole canvas and cut away the half nearer each other point.
		let polygon: Point[] = [
			[0, 0],
			[width, 0],
			[width, height],
			[0, height],
		];
		for (const other of sites) {
			if (other === site) continue;
			polygon = clipCloser(polygon, site, other);
		}
		ctx.globalAlpha = 0.3 + rng() * 0.6;
		ctx.fillStyle = palette.nodes[
			Math.floor(rng() * palette.nodes.length)
		] as string;
		ctx.beginPath();
		for (const [x, y] of polygon) ctx.lineTo(x, y);
		ctx.closePath();
		ctx.fill();
		ctx.globalAlpha = 1;
		ctx.stroke();
	}
}

/** The part of a convex polygon closer to `a` than to `b` (Sutherland–Hodgman against their bisector). */
function clipCloser(polygon: Point[], a: Point, b: Point): Point[] {
	const nx = b[0] - a[0];
	const ny = b[1] - a[1];
	const offset = (nx * (a[0] + b[0])) / 2 + (ny * (a[1] + b[1])) / 2;
	// Negative inside: on a's side of the bisector.
	const side = ([x, y]: Point) => x * nx + y * ny - offset;
	const out: Point[] = [];
	for (let i = 0; i < polygon.length; i++) {
		const p = polygon[i] as Point;
		const q = polygon[(i + 1) % polygon.length] as Point;
		const sp = side(p);
		const sq = side(q);
		if (sp <= 0) out.push(p);
		if (sp < 0 !== sq < 0) {
			const t = sp / (sp - sq);
			out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
		}
	}
	return out;
}

const styles: Record<
	GenerativeStyle,
	(
		ctx: CanvasRenderingContext2D,
		size: SceneSize,
		palette: Palette,
		rng: Rng,
	) => void
> = { dither, flow, truchet, harmonograph, ridgelines, voronoi };

/** Seeded abstract art in the site's palette: the picture for an entry with nothing of its own yet. */
export function drawGenerativeScene(
	ctx: CanvasRenderingContext2D,
	size: SceneSize,
	{ seed = 1, style }: GenerativeSceneOptions,
) {
	const palette = palettes[currentMode()];
	const rng = mulberry32(seed);
	const chosen =
		style ??
		(generativeStyles[seed % generativeStyles.length] as GenerativeStyle);

	ctx.fillStyle = palette.background;
	ctx.fillRect(0, 0, size.width, size.height);
	styles[chosen](ctx, size, palette, rng);
}

/** A dot inside a circle, the old symbol for the self. */
export function drawCircumpunct(
	ctx: CanvasRenderingContext2D,
	size: SceneSize,
) {
	const palette = palettes[currentMode()];
	const radius = size.height * 0.3;

	ctx.fillStyle = palette.background;
	ctx.fillRect(0, 0, size.width, size.height);
	ctx.strokeStyle = palette.nodes[0] as string;
	ctx.lineWidth = size.height * 0.03;
	ctx.beginPath();
	ctx.arc(size.width / 2, size.height / 2, radius, 0, TAU);
	ctx.stroke();
	ctx.fillStyle = palette.pulse;
	ctx.beginPath();
	ctx.arc(size.width / 2, size.height / 2, radius * 0.16, 0, TAU);
	ctx.fill();
}

export type GlyphSceneOptions = {
	/** The characters to show, e.g. a project's name in its own script. */
	text: string;
};

/** A word set large and centred, shaded from the palette's blue to its mauve. */
export function drawGlyph(
	ctx: CanvasRenderingContext2D,
	size: SceneSize,
	{ text }: GlyphSceneOptions,
) {
	const palette = palettes[currentMode()];
	const fontSize = size.height * 0.5;

	ctx.fillStyle = palette.background;
	ctx.fillRect(0, 0, size.width, size.height);
	// Mincho (serif) faces first, for brush-like strokes in Japanese; any CJK font will do.
	ctx.font = `600 ${fontSize}px "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif CJK JP", "Noto Serif JP", serif`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	const half = ctx.measureText(text).width / 2;
	const gradient = ctx.createLinearGradient(
		size.width / 2 - half,
		0,
		size.width / 2 + half,
		0,
	);
	gradient.addColorStop(0, palette.nodes[0] as string);
	gradient.addColorStop(1, palette.pulse);
	ctx.fillStyle = gradient;
	ctx.fillText(text, size.width / 2, size.height / 2);
}
