import type { JSX } from "@solidjs/web";
import StillCanvas from "~/components/thumbnails/StillCanvas";
import {
	drawCircumpunct,
	drawCompassScene,
	drawEpicycleScene,
	drawGenerativeScene,
	drawGlyph,
	drawMapScene,
} from "~/lib/generative-art";
import { drawPathfindingScene } from "~/lib/pathfinding/scene";
import type { SceneSize } from "~/lib/thumbnail-scene";
import {
	type SceneName,
	type SceneOptionsMap,
	THUMBNAIL_HEIGHT,
	THUMBNAIL_WIDTH,
} from "~/lib/thumbnails";

/** What a scene is given: where it's drawn and how to say it is finished. */
export type SceneContext = { onReady: () => void };

type Scene<Name extends SceneName> = (
	options: SceneOptionsMap[Name],
	context: SceneContext,
) => JSX.Element;

const SIZE: SceneSize = { width: THUMBNAIL_WIDTH, height: THUMBNAIL_HEIGHT };

/** A scene painted once onto a still canvas with the given drawing function. */
const still =
	<Options,>(
		draw: (
			ctx: CanvasRenderingContext2D,
			size: SceneSize,
			options: Options,
		) => void,
	) =>
	(options: Options, { onReady }: SceneContext) => (
		<StillCanvas
			{...SIZE}
			draw={(ctx, size) => draw(ctx, size, options)}
			onReady={onReady}
		/>
	);

/**
 * The scenes a thumbnail can pick. Each one lives with the visualizer it pictures
 * (`scene.ts` in its lib folder, or the canvas component itself); this only maps names
 * to them. Everything is seeded, so a picture comes out the same every time.
 */
export const scenes: { [Name in SceneName]: Scene<Name> } = {
	pathfinding: still(drawPathfindingScene),
	generative: still(drawGenerativeScene),
	circumpunct: still((ctx, size) => drawCircumpunct(ctx, size)),
	glyph: still(drawGlyph),
	map: still(drawMapScene),
	epicycle: still((ctx, size) => drawEpicycleScene(ctx, size)),
	compass: still((ctx, size) => drawCompassScene(ctx, size)),
};
