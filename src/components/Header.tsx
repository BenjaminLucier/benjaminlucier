import Menu from "@lucide/solid/icons/menu";
import X from "@lucide/solid/icons/x";
import { Dynamic } from "@solidjs/web";
import { createSignal, For, onSettled, Show } from "solid-js";
import SocialLinks from "~/components/SocialLinks";
import ThemeToggle from "~/components/ThemeToggle";
import { nav, site } from "~/lib/site";

/** The site bar: name, page links, then social links and the theme toggle. Sticky, and
 * the same compact bar on every page. */
export default function Header() {
	const [menuOpen, setMenuOpenSignal] = createSignal(false);

	/** Opens or closes the phone menu; the page behind it can't scroll while it's open. */
	const setMenuOpen = (open: boolean) => {
		setMenuOpenSignal(open);
		document.documentElement.style.overflow = open ? "hidden" : "";
	};

	onSettled(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape" && menuOpen()) setMenuOpen(false);
		};
		// Growing past the phone breakpoint (e.g. rotating a tablet) swaps in the
		// inline links, so the overlay closes rather than lingering behind them.
		const wide = window.matchMedia("(min-width: 48rem)");
		const onWide = () => {
			if (wide.matches) setMenuOpen(false);
		};
		window.addEventListener("keydown", onKey);
		wide.addEventListener("change", onWide);
		return () => {
			window.removeEventListener("keydown", onKey);
			wide.removeEventListener("change", onWide);
			document.documentElement.style.overflow = "";
		};
	});

	return (
		<nav
			aria-label="Primary"
			class="sticky top-0 z-40 min-h-15 border-b border-rule bg-paper py-2 md:min-h-0 md:border-b-0 md:py-4 lg:py-5 md:before:absolute md:before:-inset-x-10 md:before:inset-y-0 md:before:-z-10 md:before:border-b md:before:border-rule md:before:bg-paper md:before:content-['']"
		>
			<button
				type="button"
				onClick={() => setMenuOpen(!menuOpen())}
				aria-expanded={menuOpen() ? "true" : "false"}
				aria-controls="mobile-nav"
				aria-label={menuOpen() ? "Close menu" : "Open menu"}
				class="absolute top-2 left-0 inline-flex size-11 cursor-pointer items-center justify-center text-muted hover:text-ink md:hidden"
			>
				<Dynamic
					component={menuOpen() ? X : Menu}
					size={22}
					aria-hidden="true"
				/>
			</button>

			<ul
				id="primary-nav"
				// Phones get the overlay below instead. Tablets: links sit right, beside the
				// toggle, clear of the name. Desktop: centred.
				class="hidden items-center justify-center gap-x-6 gap-y-1 md:flex md:flex-row md:flex-wrap md:justify-end md:pr-14 lg:justify-center lg:gap-x-8 lg:pr-0"
			>
				<For each={nav}>
					{(item) => (
						<li>
							<a href={item.href} class="nav-link lg:text-sm">
								{item.label}
							</a>
						</li>
					)}
				</For>
			</ul>

			{/* Mobile: centred and pinned to the bar, so it stays put when the menu
			    expands the nav. Desktop: at the left edge. */}
			<div class="absolute top-[30px] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center leading-tight whitespace-nowrap md:top-1/2 md:left-0 md:translate-x-0 md:text-left">
				<a
					href="/"
					class="font-serif text-xl font-bold text-ink no-underline lg:text-2xl"
				>
					{site.name}
				</a>
				<p class="font-sans text-xs text-muted lg:text-sm">
					Using{" "}
					<a
						href="https://en.wikipedia.org/wiki/Logos"
						target="_blank"
						rel="noopener noreferrer"
						class="italic text-muted no-underline hover:text-link"
					>
						Logos
					</a>{" "}
					to turn Chaos into Order
				</p>
			</div>

			{/* Phones: the menu covers everything below the bar. */}
			<Show when={menuOpen()}>
				<div
					id="mobile-nav"
					class="fixed inset-x-0 top-[61px] bottom-0 flex flex-col items-center justify-center gap-10 bg-paper pb-[61px] md:hidden"
				>
					<ul class="flex flex-col items-center gap-4">
						<For each={nav}>
							{(item) => (
								<li>
									<a
										href={item.href}
										class="nav-link text-base"
										onClick={() => setMenuOpen(false)}
									>
										{item.label}
									</a>
								</li>
							)}
						</For>
					</ul>
					<SocialLinks class="flex items-center gap-2" />
				</div>
			</Show>

			<div class="absolute top-2 right-0 flex items-center md:top-1/2 md:-translate-y-1/2">
				{/* Below lg there is no room beside the links; the footer carries them. */}
				<SocialLinks class="hidden items-center lg:flex" />
				<ThemeToggle />
			</div>
		</nav>
	);
}
