// Imported by scripts/*.ts under plain Node: only `import type` from the app, since
// those are erased and nothing here may need Vite (the `~` alias, CSS, JSX).
import type {
	GenerativeSceneOptions,
	GlyphSceneOptions,
} from "~/lib/generative-art";
import type { PathfindingSceneOptions } from "~/lib/pathfinding/scene";

/** Options for each scene; the keys are the scene names (see src/lib/thumbnail-scenes.tsx). */
export type SceneOptionsMap = {
	pathfinding: PathfindingSceneOptions;
	generative: GenerativeSceneOptions;
	circumpunct: Record<string, never>;
	glyph: GlyphSceneOptions;
};
export type SceneName = keyof SceneOptionsMap;

export type ThumbnailKind = "work";
export type ThumbnailMode = "light" | "dark";
export const THUMBNAIL_MODES: readonly ThumbnailMode[] = ["light", "dark"];

/**
 * Every work entry needs one of these.
 * - `image`: a file you made, as a path relative to the repo root (one for both themes,
 *   or one per theme).
 * - `scene`: the real visualizer, rendered by `pnpm thumbnails` with `options` fixing its
 *   settings, in both themes. `options.seed` defaults to a hash of the slug.
 */
export type Thumbnail =
	| { image: string | { light: string; dark: string } }
	| {
			[Name in SceneName]: { scene: Name; options?: SceneOptionsMap[Name] };
	  }[SceneName];

export const THUMBNAIL_WIDTH = 600;
/** 600x315 doubles to 1200x630, the 1.91:1 ratio Open Graph cards are cut for. */
export const THUMBNAIL_HEIGHT = 315;

/** Size of every image written to public/: the stage rendered at twice the density. */
export const IMAGE_WIDTH = THUMBNAIL_WIDTH * 2;
export const IMAGE_HEIGHT = THUMBNAIL_HEIGHT * 2;

/**
 * Extra widths generated for `srcSet`, below the full IMAGE_WIDTH. Cards render between
 * ~33vw (desktop grids) and full width (mobile), at 1-3x DPR, so these three sizes cover
 * every slot without over-fetching.
 */
export const THUMBNAIL_VARIANT_WIDTHS = [480, 800] as const;

/** How wide the card slot is, for the browser to pick a srcSet entry. */
export const THUMBNAIL_SIZES =
	"(min-width: 1024px) 33vw, (min-width: 768px) 50vw, calc(100vw - 2rem)";

/** The entry whose social image stands in for every page, and whose scene doubles as
 * the favicon: the portfolio's circumpunct. It is the only entry with a social image. */
export const SITE_IMAGE = { kind: "work", slug: "benjaminlucier" } as const;

/** Site path of an entry's social preview image, which is also its path under public/. */
export const ogSrc = (kind: ThumbnailKind, slug: string) =>
	`/${kind}-og/${slug}.png`;

/**
 * Site path of an entry's thumbnail for one theme, which is also its path under public/.
 * The default width is the unsuffixed full-size file; smaller widths get a `-<w>` suffix.
 */
export const thumbnailSrc = (
	kind: ThumbnailKind,
	slug: string,
	mode: ThumbnailMode,
	width: number = IMAGE_WIDTH,
) =>
	width === IMAGE_WIDTH
		? `/${kind}-thumbnails/${slug}-${mode}.webp`
		: `/${kind}-thumbnails/${slug}-${mode}-${width}.webp`;

/** All widths of one thumbnail, as a srcSet value. */
export const thumbnailSrcSet = (
	kind: ThumbnailKind,
	slug: string,
	mode: ThumbnailMode,
) =>
	[...THUMBNAIL_VARIANT_WIDTHS, IMAGE_WIDTH]
		.map((width) => `${thumbnailSrc(kind, slug, mode, width)} ${width}w`)
		.join(", ");
