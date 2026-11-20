import { Link } from "@kobalte/core/link";
import { Meta } from "@solidjs/meta";
import PageTitle from "~/components/PageTitle";

// Catch-all: matches any path no other route claims. Prerendered to 404.html
// (see vite.config.ts) and served by Cloudflare with a 404 status.
export default function NotFound() {
	return (
		<section class="mx-auto max-w-column py-10 text-center">
			<PageTitle title="Page not found" />
			<Meta name="robots" content="noindex" />
			<p class="meta font-semibold uppercase tracking-widest">404</p>
			<h1 class="mt-3 font-sans text-4xl font-bold tracking-tight text-ink">
				Page not found
			</h1>
			<p class="mt-4 text-muted">
				The page you're looking for doesn't exist or has moved.
			</p>
			<p class="mt-6">
				<Link href="/" class="meta-link">
					← Back home
				</Link>
			</p>
		</section>
	);
}
