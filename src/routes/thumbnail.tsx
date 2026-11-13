import { Meta } from "@solidjs/meta";
import { createSignal, onSettled, Show } from "solid-js";
import { seedFromString } from "~/lib/rng";
import { site } from "~/lib/site";
import { scenes } from "~/lib/thumbnail-scenes";
import {
	SITE_IMAGE,
	THUMBNAIL_HEIGHT,
	THUMBNAIL_WIDTH,
} from "~/lib/thumbnails";
import { work } from "~/lib/work";

// Render target for `pnpm thumbnails`: /thumbnail?kind=work&slug=travel-nexus&mode=dark
// mounts that entry's scene alone, in the given theme, in a fixed stage that the
// script screenshots. With &social=1 the stage adds the title + CTA overlay for
// the Open Graph image. Not linked from anywhere, so it is never prerendered.
export default function Thumbnail() {
	let stageRef: HTMLDivElement | undefined;
	const [scene, setScene] = createSignal<unknown>(null);
	const [social, setSocial] = createSignal<{
		image?: string;
		title: string;
		cta: string;
	} | null>(null);

	onSettled(() => {
		const stage = stageRef;
		if (!stage) return;
		const params = new URLSearchParams(location.search);
		const slug = params.get("slug") ?? "";
		const social = params.get("social") === "1";
		const mode = params.get("mode") === "light" ? "light" : "dark";
		const entry = work.find((w) => w.slug === slug);
		const thumbnail = entry?.thumbnail;
		if (!thumbnail) {
			stage.dataset.error = `no thumbnail for "${slug}"`;
			return;
		}

		// The site-wide social image is titled with the site's name, not its entry's.
		const title = slug === SITE_IMAGE.slug ? site.name : entry.title;

		// The visualizers read their palette from this attribute.
		document.documentElement.dataset.mode = mode;

		// Fonts are part of the picture (the matrix glyphs, the overlay), so wait for them.
		document.fonts.ready.then(() => {
			if ("scene" in thumbnail) {
				const options = { seed: seedFromString(slug), ...thumbnail.options };
				const render = scenes[thumbnail.scene] as (
					options: unknown,
					context: { onReady: () => void },
				) => unknown;
				setScene(
					render(options, {
						onReady: () => {
							stage.dataset.ready = "";
						},
					}),
				);
				if (social) {
					setSocial({
						title,
						cta: "See the portfolio",
					});
				}
			} else if (social) {
				// Image thumbnails have no scene to mount; the stage shows the image
				// under the overlay instead, so the social image gets one too.
				const path =
					typeof thumbnail.image === "string"
						? thumbnail.image
						: thumbnail.image[mode];
				const image = new Image();
				image.src = path;
				image
					.decode()
					.then(() => {
						setSocial({
							image: path,
							title,
							cta: "See the portfolio",
						});
						stage.dataset.ready = "";
					})
					.catch(() => {
						stage.dataset.error = `could not decode ${path}`;
					});
			} else {
				stage.dataset.error = `no scene thumbnail for "${slug}"`;
			}
		});
	});

	return (
		<div
			ref={stageRef}
			id="thumbnail-stage"
			// Fixed over the site chrome, so the capture is the scene and nothing else.
			class="fixed top-0 left-0 z-50 overflow-hidden bg-paper"
			style={{ width: `${THUMBNAIL_WIDTH}px`, height: `${THUMBNAIL_HEIGHT}px` }}
		>
			<Meta name="robots" content="noindex" />
			{scene() as never}
			<Show when={social()}>
				{(social) => (
					<>
						<Show when={social().image}>
							{(image) => (
								<img
									src={image()}
									alt=""
									class="absolute inset-0 size-full object-cover"
								/>
							)}
						</Show>
						<div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/45 to-transparent px-6 pt-24 pb-5 text-left">
							<p class="font-serif text-[34px] leading-tight font-bold tracking-tight text-white">
								{social().title}
							</p>
							<p class="mt-3 flex items-center gap-3 font-sans text-[15px] text-white/75">
								<span class="rounded-full bg-white/15 px-3.5 py-1.5 font-semibold tracking-wide text-white">
									{social().cta} →
								</span>
								benjaminlucier.com
							</p>
						</div>
					</>
				)}
			</Show>
		</div>
	);
}
