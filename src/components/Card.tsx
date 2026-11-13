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

/** Linked work entry: thumbnail, meta line, title and summary. */
export default function Card(props: {
	href: string;
	/** Which entry's thumbnail to show, in both themes; see src/lib/thumbnails.ts. */
	image: { kind: ThumbnailKind; slug: string };
	external?: boolean;
	meta?: string | undefined;
	/** Shown to the right of the title: e.g. a release-stage warning. */
	badge?: JSX.Element;
	title: string;
	summary: string;
	lead?: boolean | undefined;
}) {
	return (
		<article>
			<a
				href={props.href}
				target={props.external ? "_blank" : undefined}
				rel={props.external ? "noopener" : undefined}
				class="group flex flex-col pb-6 text-inherit no-underline"
			>
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
				<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
					<h2
						class={`font-bold leading-snug tracking-tight text-ink group-hover:text-link ${
							props.lead ? "text-4xl" : "text-2xl"
						}`}
					>
						{props.title}
					</h2>
					{props.badge}
				</div>
				<p class="mt-2 flex-1 text-base text-muted">{props.summary}</p>
			</a>
		</article>
	);
}
