import Monitor from "@lucide/solid/icons/monitor";
import Moon from "@lucide/solid/icons/moon";
import Sun from "@lucide/solid/icons/sun";
import { Dynamic } from "@solidjs/web";
import { createSignal, onSettled } from "solid-js";
import { applyThemeColor } from "~/lib/theme-colors";

type Pref = "system" | "light" | "dark";
const order: Pref[] = ["system", "light", "dark"];
const icons = { system: Monitor, light: Sun, dark: Moon };
const labels = {
	system: "System theme",
	light: "Light theme",
	dark: "Dark theme",
};

export default function ThemeToggle() {
	const [pref, setPref] = createSignal<Pref>("dark");

	// The inline <head> script already applied the theme; just sync our state.
	onSettled(() => {
		setPref((document.documentElement.dataset.pref as Pref) ?? "dark");
	});

	const cycle = () => {
		const next = order[(order.indexOf(pref()) + 1) % order.length] ?? "system";
		setPref(next);
		localStorage.setItem("theme-pref", next);
		const d = document.documentElement;
		d.dataset.pref = next;
		const mode =
			next === "system"
				? matchMedia("(prefers-color-scheme: dark)").matches
					? "dark"
					: "light"
				: next;
		d.dataset.mode = mode;
		applyThemeColor(mode);
	};

	return (
		<button
			type="button"
			onClick={cycle}
			class="inline-flex size-11 cursor-pointer items-center justify-center text-muted hover:text-ink"
			aria-label={`${labels[pref()]} (click to change)`}
			title={labels[pref()]}
		>
			<Dynamic component={icons[pref()]} size={18} aria-hidden="true" />
		</button>
	);
}
