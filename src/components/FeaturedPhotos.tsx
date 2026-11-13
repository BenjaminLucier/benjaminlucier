import { createSignal, For, onSettled } from "solid-js";

/** Shown in this order. Square crops, so `position` picks what stays in frame. */
const photos = [
	{
		src: "/FeaturedImage2.webp",
		alt: "Benjamin Lucier smiling, carrying a boy in an orange shirt on his shoulders",
		width: 512,
		height: 683,
		position: "50% 62%",
	},
	{
		src: "/FeaturedImage3.webp",
		alt: "Benjamin Lucier crouched beside his loaded touring motorcycle on a gravel roadside, mountains behind",
		width: 512,
		height: 909,
		position: "50% 100%",
	},
	{
		src: "/FeaturedImage1.webp",
		alt: "Benjamin Lucier dancing at a wedding, tie around his neck",
		width: 512,
		height: 384,
		position: "52% 50%",
	},
	{
		src: "/FeaturedImage4.webp",
		alt: "Benjamin Lucier taking a selfie on a snowy mountain ridge, a friend in ski goggles behind him",
		width: 512,
		height: 683,
		position: "50% 90%",
	},
] as const;

/** How long each photo is shown before the next fades in. */
const SHOW_MS = 3000;
/** Length of the crossfade. */
const FADE_MS = 900;
/** How far the showing photo slowly zooms in, as a scale factor. */
const ZOOM = 1.06;

/**
 * The About photos, crossfading into one another in place every few seconds while
 * the one on show zooms in slowly. A click moves to the next photo straight away and
 * restarts the countdown. With reduced motion asked for, photos only change on a
 * click, instantly, and nothing zooms.
 */
export default function FeaturedPhotos(props: { class?: string }) {
	const [current, setCurrent] = createSignal(0);
	/** The pending automatic advance; never set when motion is reduced. */
	let timer: number | undefined;
	let auto = false;

	const next = () => setCurrent((i) => (i + 1) % photos.length);

	/** (Re)starts the countdown to the next automatic advance. */
	function schedule() {
		window.clearTimeout(timer);
		if (!auto) return;
		timer = window.setTimeout(() => {
			// Don't spend fades on a tab nobody is looking at.
			if (!document.hidden) next();
			schedule();
		}, SHOW_MS);
	}

	onSettled(() => {
		auto = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		schedule();
		return () => {
			auto = false;
			window.clearTimeout(timer);
		};
	});

	return (
		<button
			type="button"
			onClick={() => {
				next();
				schedule();
			}}
			aria-label="Show the next photo"
			class={`relative size-56 shrink-0 cursor-pointer overflow-hidden rounded-2xl ${props.class ?? ""}`}
		>
			<For each={photos}>
				{(photo, i) => {
					const showing = () => current() === i();
					return (
						<img
							src={photo.src}
							alt={showing() ? photo.alt : ""}
							width={photo.width}
							height={photo.height}
							class="absolute inset-0 size-full object-cover motion-reduce:transform-none! motion-reduce:transition-none!"
							style={{
								"object-position": photo.position,
								opacity: showing() ? 1 : 0,
								transform: showing() ? `scale(${ZOOM})` : "scale(1)",
								// Showing: fade in while zooming across its whole turn. Leaving: fade
								// out, then reset the zoom unseen once it is fully transparent.
								transition: showing()
									? `opacity ${FADE_MS}ms ease, transform ${SHOW_MS + FADE_MS}ms linear`
									: `opacity ${FADE_MS}ms ease, transform 0s linear ${FADE_MS}ms`,
							}}
						/>
					);
				}}
			</For>
		</button>
	);
}
