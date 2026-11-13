import { For } from "solid-js";
import { social } from "~/lib/site";

/** Social icon links, shared by the header bar (wide screens) and the footer (narrower ones). */
export default function SocialLinks(props: { class?: string | undefined }) {
	return (
		<ul class={props.class}>
			<For each={social}>
				{(s) => (
					<li>
						<a
							href={s.href}
							target="_blank"
							rel="me noopener noreferrer"
							title={s.label}
							// Hover shows the brand's own colour.
							style={{ "--brand": s.color }}
							class="inline-flex size-11 items-center justify-center text-muted transition-colors hover:text-(--brand)"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								width="20"
								height="20"
								fill="currentColor"
								aria-hidden="true"
							>
								<path d={s.path} />
							</svg>
							<span class="sr-only">{s.label}</span>
						</a>
					</li>
				)}
			</For>
		</ul>
	);
}
