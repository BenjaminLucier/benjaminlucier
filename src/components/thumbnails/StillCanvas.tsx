import { onSettled } from "solid-js";
import type { SceneSize } from "~/lib/thumbnail-scene";

/** A canvas of the thumbnail's size that is painted once and reports when it is done. */
export default function StillCanvas(
	props: SceneSize & {
		draw: (ctx: CanvasRenderingContext2D, size: SceneSize) => void;
		onReady: () => void;
	},
) {
	let canvasRef: HTMLCanvasElement | undefined;
	// Whole pixels per CSS pixel; the OG images are rendered at 2.
	const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;

	onSettled(() => {
		const ctx = canvasRef?.getContext("2d");
		if (!ctx) return;
		ctx.scale(dpr, dpr);
		props.draw(ctx, { width: props.width, height: props.height });
		props.onReady();
	});

	return (
		<canvas
			ref={canvasRef}
			width={props.width * dpr}
			height={props.height * dpr}
			style={{ width: `${props.width}px`, height: `${props.height}px` }}
			class="block"
		/>
	);
}
