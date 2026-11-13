import type { JSX } from "@solidjs/web";
import { HydrationScript } from "@solidjs/web";
import { catppuccinCss } from "~/lib/catppuccin";
import { THEME_COLORS } from "~/lib/theme-colors";
import { themeScript } from "~/lib/theme-script";

export default function Document(props: { children?: JSX.Element }) {
	return (
		// data-mode="dark" is the no-JS fallback; the head script overrides it before first paint.
		<html lang="en" data-mode="dark">
			<head>
				<meta charset="utf-8" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, viewport-fit=cover"
				/>
				<meta name="color-scheme" content="light dark" />
				{/* Before the theme script, which keeps it in sync with the mode. */}
				<meta name="theme-color" content={THEME_COLORS.dark} />
				{/* Rendered from the portfolio's circumpunct scene by `pnpm thumbnails`. */}
				<link rel="icon" href="/favicon.ico" sizes="32x32" />
				<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
				{/* The Catppuccin palette as --ctp-* variables; values live in lib/catppuccin.ts. */}
				<style innerHTML={catppuccinCss()} />
				{/* Must stay first and synchronous: sets data-mode before first paint. */}
				<script innerHTML={themeScript} />
				{/* Without JS the menu toggle can't open the nav; show it as a wrapping row. */}
				<noscript>
					<style innerHTML="#primary-nav{display:flex!important;flex-wrap:wrap}" />
				</noscript>
				<HydrationScript />
			</head>
			<body>{props.children}</body>
		</html>
	);
}
