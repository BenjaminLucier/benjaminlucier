import { site } from "~/lib/site";

/** Points readers at the Substack, which handles the signup and confirmation itself. */
export default function NewsletterSignup(props: { class?: string }) {
	return (
		<section
			class={`flex flex-col gap-4 rounded-xl border border-rule bg-wash p-5 font-sans sm:flex-row sm:items-center sm:justify-between ${props.class ?? ""}`}
			aria-labelledby="newsletter-heading"
		>
			<div>
				<h2 id="newsletter-heading" class="text-lg font-bold text-ink">
					Get new work and writing by email
				</h2>
				<p class="mt-1 text-base text-muted">
					Free on Substack. No spam, unsubscribe anytime.
				</p>
			</div>
			{/* Styled like the primary Button, but it's a link: it leaves the site. */}
			<a
				href={`${site.newsletter}/subscribe`}
				target="_blank"
				rel="noopener"
				class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-ink bg-ink px-4 text-base font-medium whitespace-nowrap text-paper no-underline shadow-sm transition-opacity hover:text-paper hover:opacity-85"
			>
				Subscribe on Substack
			</a>
		</section>
	);
}
