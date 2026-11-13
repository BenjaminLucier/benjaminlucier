/** Browser-chrome color per mode; keep in sync with the tokens in styles/app.css. */
export const THEME_COLORS = {
	light: "#ffffff",
	dark: "#121212",
} as const;

export type ThemeMode = keyof typeof THEME_COLORS;

/** Points the theme-color meta at the given mode's color. */
export const applyThemeColor = (mode: string) => {
	const color = THEME_COLORS[mode as ThemeMode] ?? THEME_COLORS.dark;
	document
		.querySelector('meta[name="theme-color"]')
		?.setAttribute("content", color);
};
