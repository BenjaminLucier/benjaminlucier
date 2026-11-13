import SocialLinks from "~/components/SocialLinks";
import { site } from "~/lib/site";

/** Site-wide footer: build credits, a link to the source and copyright. */
export default function Footer() {
	// Baked in at prerender; refreshed on each deploy.
	const year = new Date().getFullYear();

	return (
		<footer class="border-t border-rule py-6 text-center">
			{/* Below lg only: on wide screens the social icons sit in the header bar. */}
			<SocialLinks class="mb-3 flex justify-center gap-1 lg:hidden" />
			<p class="meta">
				{/* Spaces live in string literals: JSX drops whitespace across
				    newlines, which would glue words together when the line wraps. */}
				{"Made with "}
				<ExternalLink href="https://www.solidjs.com">SolidJS</ExternalLink>
				{", "}
				<ExternalLink href="https://tailwindcss.com">TailwindCSS</ExternalLink>
				{" & Vibes · Hosted on "}
				<ExternalLink href="https://www.cloudflare.com">
					Cloudflare
				</ExternalLink>
				{" · "}
				<ExternalLink href={site.source}>View Source</ExternalLink>
				{` · © ${site.name} ${year}`}
			</p>
		</footer>
	);
}

function ExternalLink(props: { href: string; children: string }) {
	return (
		<a href={props.href} target="_blank" rel="noopener" class="meta-link">
			{props.children}
		</a>
	);
}
