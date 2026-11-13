/**
 * Catppuccin, the one palette for every coloured diagram, visualization, figure and
 * thumbnail on the site: Latte in light mode, Mocha in dark. https://catppuccin.com/palette
 *
 * This file is the single source of truth. Canvas code, the Mermaid build plugin and the
 * thumbnail renderer import it directly; for CSS, Document.tsx injects it as `--ctp-*`
 * custom properties (see `catppuccinCss`), which app.css maps to Tailwind colours, so
 * `bg-ctp-blue`, `text-ctp-subtext0` etc. follow the theme. Visualizer palettes pick
 * roles from it ("search is sapphire"); none of them repeat a hex value.
 *
 * Plain erasable TypeScript with no imports: plugins/ loads it straight into Node.
 */

export type Mode = "light" | "dark";

export const CTP_COLORS = [
	"rosewater",
	"flamingo",
	"pink",
	"mauve",
	"red",
	"maroon",
	"peach",
	"yellow",
	"green",
	"teal",
	"sky",
	"sapphire",
	"blue",
	"lavender",
	"text",
	"subtext1",
	"subtext0",
	"overlay2",
	"overlay1",
	"overlay0",
	"surface2",
	"surface1",
	"surface0",
	"base",
	"mantle",
	"crust",
] as const;

export type CtpColor = (typeof CTP_COLORS)[number];
export type Flavour = Readonly<Record<CtpColor, string>>;

const latte: Flavour = {
	rosewater: "#dc8a78",
	flamingo: "#dd7878",
	pink: "#ea76cb",
	mauve: "#8839ef",
	red: "#d20f39",
	maroon: "#e64553",
	peach: "#fe640b",
	yellow: "#df8e1d",
	green: "#40a02b",
	teal: "#179299",
	sky: "#04a5e5",
	sapphire: "#209fb5",
	blue: "#1e66f5",
	lavender: "#7287fd",
	text: "#4c4f69",
	subtext1: "#5c5f77",
	subtext0: "#6c6f85",
	overlay2: "#7c7f93",
	overlay1: "#8c8fa1",
	overlay0: "#9ca0b0",
	surface2: "#acb0be",
	surface1: "#bcc0cc",
	surface0: "#ccd0da",
	base: "#eff1f5",
	mantle: "#e6e9ef",
	crust: "#dce0e8",
};

const mocha: Flavour = {
	rosewater: "#f5e0dc",
	flamingo: "#f2cdcd",
	pink: "#f5c2e7",
	mauve: "#cba6f7",
	red: "#f38ba8",
	maroon: "#eba0ac",
	peach: "#fab387",
	yellow: "#f9e2af",
	green: "#a6e3a1",
	teal: "#94e2d5",
	sky: "#89dceb",
	sapphire: "#74c7ec",
	blue: "#89b4fa",
	lavender: "#b4befe",
	text: "#cdd6f4",
	subtext1: "#bac2de",
	subtext0: "#a6adc8",
	overlay2: "#9399b2",
	overlay1: "#7f849c",
	overlay0: "#6c7086",
	surface2: "#585b70",
	surface1: "#45475a",
	surface0: "#313244",
	base: "#1e1e2e",
	mantle: "#181825",
	crust: "#11111b",
};

/** Latte for light mode, Mocha for dark. */
export const catppuccin: Readonly<Record<Mode, Flavour>> = {
	light: latte,
	dark: mocha,
};

/** The site's current theme (the `data-mode` attribute on <html>). Browser only. */
export const currentMode = (): Mode =>
	document.documentElement.dataset.mode === "light" ? "light" : "dark";

/** The flavour for the site's current theme. Browser only. */
export const currentFlavour = (): Flavour => catppuccin[currentMode()];

/** Builds a per-theme palette from a function of the flavour: `byMode((c) => ({ path: c.mauve }))`. */
export const byMode = <T>(pick: (c: Flavour) => T): Record<Mode, T> => ({
	light: pick(latte),
	dark: pick(mocha),
});

/** `rgb(r g b / alpha)` for a hex colour, for translucent strokes and fills. */
export function withAlpha(hex: string, alpha: number): string {
	const n = Number.parseInt(hex.slice(1), 16);
	return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${alpha})`;
}

/**
 * The flavours as `--ctp-<name>` custom properties, Mocha by default (the site's no-JS
 * theme) and Latte under `[data-mode="light"]`. Injected into <head> by Document.tsx.
 */
export function catppuccinCss(): string {
	const vars = (f: Flavour) =>
		CTP_COLORS.map((name) => `--ctp-${name}:${f[name]}`).join(";");
	return `:root,[data-mode="dark"]{${vars(mocha)}}[data-mode="light"]{${vars(latte)}}`;
}
