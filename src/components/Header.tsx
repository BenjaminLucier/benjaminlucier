import { Menu, X } from "lucide";
import { createSignal, For, onSettled, Show } from "solid-js";
import Icon from "~/components/Icon";
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
		const wide = window.matchMedia("(min-width: 40rem)");
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
			class="sticky top-0 z-40 min-h-15 border-b border-rule bg-paper py-2 sm:min-h-0 sm:border-b-0 sm:py-3 sm:before:absolute sm:before:-inset-x-10 sm:before:inset-y-0 sm:before:-z-10 sm:before:border-b sm:before:border-rule sm:before:bg-paper sm:before:content-['']"
		>
			<button
				type="button"
				onClick={() => setMenuOpen(!menuOpen())}
				aria-expanded={menuOpen() ? "true" : "false"}
				aria-controls="mobile-nav"
				aria-label={menuOpen() ? "Close menu" : "Open menu"}
				class="absolute top-2 left-0 inline-flex size-11 cursor-pointer items-center justify-center text-muted hover:text-ink sm:hidden"
			>
				<Icon icon={menuOpen() ? X : Menu} size={22} />
			</button>

			<ul
				id="primary-nav"
				// Phones get the overlay below instead. Tablets: links sit right, beside the
				// toggle, clear of the name. Desktop: centred.
				class="hidden items-center justify-center gap-x-6 gap-y-1 sm:flex sm:flex-row sm:flex-wrap sm:justify-end sm:pr-14 lg:justify-center lg:gap-x-8 lg:pr-0"
			>
				<For each={nav}>
					{(item) => (
						<li>
							<a href={item.href} class="nav-link">
								{item.label}
							</a>
						</li>
					)}
				</For>
			</ul>

			{/* Mobile: centred and pinned to the bar, so it stays put when the menu
			    expands the nav. Desktop: at the left edge. */}
			<div class="absolute top-[30px] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center leading-tight whitespace-nowrap sm:top-1/2 sm:left-0 sm:translate-x-0 sm:text-left">
				<a href="/" class="font-serif text-lg font-bold text-ink no-underline">
					{site.name}
				</a>
				<p class="font-sans text-xs text-muted">
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
					class="fixed inset-x-0 top-[61px] bottom-0 flex flex-col items-center justify-center gap-10 bg-paper pb-[61px] sm:hidden"
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

			<div class="absolute top-2 right-0 flex items-center sm:top-1/2 sm:-translate-y-1/2">
				{/* Below lg there is no room beside the links; the footer carries them. */}
				<SocialLinks class="hidden items-center lg:flex" />
				<ThemeToggle />
			</div>
		</nav>
	);
}
