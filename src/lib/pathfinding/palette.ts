import {
	byMode,
	catppuccin,
	currentMode,
	type Mode,
	withAlpha,
} from "~/lib/catppuccin";

export type { Mode };

export type Rgb = readonly [number, number, number];

/** Colours for one theme. */
export type PaletteColors = {
	background: string;
	edge: string;
	tree: string;
	pathEdge: string;
	idle: string;
	wall: string;
	start: string;
	end: string;
	search: string;
	path: string;
	dragStart: string;
	dragEnd: string;
	gridLine: string;
};

export type Palette = PaletteColors & {
	/** idle / search / path as numbers, for blending during animations. */
	rgb: { idle: Rgb; search: Rgb; path: Rgb };
};

function toRgb(hex: string): Rgb {
	const n = Number.parseInt(hex.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const define = (c: PaletteColors): Palette => ({
	...c,
	rgb: { idle: toRgb(c.idle), search: toRgb(c.search), path: toRgb(c.path) },
});

/**
 * Roles picked from the site's Catppuccin palette (lib/catppuccin.ts), per theme. The
 * legend swatches in Pathfinding.tsx use the same roles as `bg-ctp-*` classes.
 */
export const palettes: Record<Mode, Palette> = byMode((c) =>
	define({
		background: c.base,
		edge: c.surface1,
		tree: c.sapphire,
		pathEdge: c.mauve,
		idle: c.overlay0,
		// Walls are the darkest thing on the board: text on Latte, crust on Mocha.
		wall: c === catppuccin.light ? c.text : c.crust,
		start: c.green,
		end: c.red,
		search: c.sapphire,
		path: c.mauve,
		dragStart: c.teal,
		dragEnd: c.maroon,
		gridLine: withAlpha(c.text, c === catppuccin.light ? 0.25 : 0.15),
	}),
);

/** The palette for the site's current theme (the `data-mode` attribute on <html>). */
export const currentPalette = (): Palette => palettes[currentMode()];

/** Length of every cell animation. */
export const ANIM_MS = 500;

export function mix(a: Rgb, b: Rgb, t: number): string {
	const c = (i: 0 | 1 | 2) => Math.round(a[i] + (b[i] - a[i]) * t);
	return `rgb(${c(0)} ${c(1)} ${c(2)})`;
}

/** Three-stop keyframe animation (0%, 50%, 100%) with each segment eased. */
export function keyframes(
	t: number,
	from: number,
	mid: number,
	to: number,
): number {
	const [a, b, u] = t < 0.5 ? [from, mid, t * 2] : [mid, to, (t - 0.5) * 2];
	return a + (b - a) * (u * u * (3 - 2 * u));
}

export const TAU = Math.PI * 2;
