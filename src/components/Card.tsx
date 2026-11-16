import type { JSX } from "@solidjs/web";
import { Show } from "solid-js";
import {
	IMAGE_HEIGHT,
	IMAGE_WIDTH,
	THUMBNAIL_SIZES,
	type ThumbnailKind,
	thumbnailSrc,
	thumbnailSrcSet,
} from "~/lib/thumbnails";

/**
 * Linked work entry: thumbnail, meta line, title and summary.
 *
 * The title's link is stretched over the whole card (its `::after` covers the
 * article), so a click anywhere goes to `href`. Links of their own (`actions`) sit
 * above that layer with `relative z-10`; nesting them inside one big <a> would be
 * invalid HTML.
 */
export default function Card(props: {
	href: string;
	/** Which entry's thumbnail to show, in both themes; see src/lib/thumbnails.ts. */
	image: { kind: ThumbnailKind; slug: string };
	external?: boolean;
	meta?: string | undefined;
	/** Shown right after the title: e.g. a release-stage mark. */
	badge?: JSX.Element;
	/** Links of their own, at the end of the title row. */
	actions?: JSX.Element;
	title: string;
	summary: string;
	lead?: boolean | undefined;
}) {
	return (
		<article class="group relative flex flex-col pb-6">
			{/* Two images swapped with the site theme: it is a data-mode attribute, which a <picture> media query can't follow. */}
			<img
				src={thumbnailSrc(props.image.kind, props.image.slug, "light")}
				srcset={thumbnailSrcSet(props.image.kind, props.image.slug, "light")}
				sizes={THUMBNAIL_SIZES}
				alt=""
				width={IMAGE_WIDTH}
				height={IMAGE_HEIGHT}
				loading="lazy"
				decoding="async"
				class="mb-4 aspect-[40/21] w-full border border-rule object-cover dark:hidden"
			/>
			<img
				src={thumbnailSrc(props.image.kind, props.image.slug, "dark")}
				srcset={thumbnailSrcSet(props.image.kind, props.image.slug, "dark")}
				sizes={THUMBNAIL_SIZES}
				alt=""
				width={IMAGE_WIDTH}
				height={IMAGE_HEIGHT}
				loading="lazy"
				decoding="async"
				class="mb-4 hidden aspect-[40/21] w-full border border-rule object-cover dark:block"
			/>
			<Show when={props.meta}>
				<span class="meta mb-1">{props.meta}</span>
			</Show>
			<div class="flex items-center gap-x-2">
				<h2
					class={`font-bold leading-snug tracking-tight text-ink group-hover:text-link ${
						props.lead ? "text-4xl" : "text-2xl"
					}`}
				>
					<a
						href={props.href}
						target={props.external ? "_blank" : undefined}
						rel={props.external ? "noopener" : undefined}
						class="text-inherit no-underline after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-link"
					>
						{props.title}
					</a>
				</h2>
				{props.badge}
				<Show when={props.actions}>
					<div class="relative z-10 ml-auto flex items-center">
						{props.actions}
					</div>
				</Show>
			</div>
			<p class="mt-2 flex-1 text-base text-muted">{props.summary}</p>
		</article>
	);
}
