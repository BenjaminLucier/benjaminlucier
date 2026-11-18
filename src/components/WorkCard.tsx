import Globe from "@lucide/solid/icons/globe";
import Package from "@lucide/solid/icons/package";
import { siGithub, siNpm } from "simple-icons";
import { For, Show } from "solid-js";
import Card from "~/components/Card";
import type { Work, WorkLinks } from "~/lib/work";

/** A filled simple-icons glyph, the same way the header draws its social icons. */
function Glyph(props: { path: string; size: number }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width={props.size}
			height={props.size}
			fill="currentColor"
			aria-hidden="true"
		>
			<path d={props.path} />
		</svg>
	);
}

/**
 * The icon links, in the order they're shown. simple-icons has no crates.io logo, so
 * crates use lucide's package box; the site link uses its globe.
 */
const linkIcons: {
	key: keyof WorkLinks;
	label: string;
	icon: () => ReturnType<typeof Glyph>;
	/** Hover colour, as in the header. */
	color: string;
}[] = [
	{
		key: "site",
		label: "Website",
		icon: () => <Globe size={18} aria-hidden="true" />,
		color: "var(--color-link)",
	},
	{
		key: "repo",
		label: "Source on GitHub",
		icon: () => <Glyph path={siGithub.path} size={17} />,
		// GitHub's brand colour is near-black, which vanishes on the dark theme.
		color: "var(--color-ink)",
	},
	{
		key: "crate",
		label: "Crate on crates.io",
		icon: () => <Package size={18} aria-hidden="true" />,
		color: "var(--color-ctp-peach)",
	},
	{
		key: "npm",
		label: "Package on npm",
		icon: () => <Glyph path={siNpm.path} size={17} />,
		color: `#${siNpm.hex}`,
	},
];

export default function WorkCard(props: { work: Work }) {
	const links = () => linkIcons.filter((l) => props.work.links[l.key]);
	return (
		<Card
			href={props.work.href}
			external={!props.work.href.startsWith("/")}
			image={{ kind: "work", slug: props.work.slug }}
			badge={
				<Show when={props.work.alpha}>
					<span
						title="Alpha: early, still changing"
						class="relative z-10 cursor-help font-sans text-xl font-semibold leading-none text-ctp-yellow"
					>
						<span aria-hidden="true">α</span>
						<span class="sr-only">(alpha)</span>
					</span>
				</Show>
			}
			actions={
				<For each={links()}>
					{(l) => {
						const href = props.work.links[l.key] as string;
						const external = !href.startsWith("/");
						return (
							<a
								href={href}
								target={external ? "_blank" : undefined}
								rel={external ? "noopener" : undefined}
								title={l.label}
								style={{ "--brand": l.color }}
								class="inline-flex size-9 items-center justify-center text-muted transition-colors hover:text-(--brand)"
							>
								{l.icon()}
								<span class="sr-only">
									{l.label}: {props.work.title}
								</span>
							</a>
						);
					}}
				</For>
			}
			title={props.work.title}
			summary={props.work.summary}
		/>
	);
}
