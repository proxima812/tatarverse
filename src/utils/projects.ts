import type { ImageMetadata } from "astro";

const projectAssets = import.meta.glob<{ default: ImageMetadata }>(
	"../assets/projects/**/*.{jpg,jpeg,png,webp}",
	{ eager: true },
);

/**
 * Resolve a project asset (logo/photo) by its relative path inside
 * `src/assets/projects`. Returns `null` when the asset is missing so callers
 * can render a graceful gradient fallback instead of failing the build.
 */
export function getProjectAsset(path?: string): ImageMetadata | null {
	if (!path) return null;

	return projectAssets[`../assets/projects/${path}`]?.default ?? null;
}

/** First visible character of a title, used inside the gradient fallback. */
export function getProjectInitial(title: string): string {
	return Array.from(title.trim())[0]?.toUpperCase() ?? "•";
}

/**
 * Deterministic, tasteful gradient derived from the project title. The same
 * title always yields the same gradient, so placeholders stay stable across
 * builds while different projects look distinct.
 */
export function getProjectGradient(seed: string): string {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash << 5) - hash + seed.charCodeAt(i);
		hash |= 0;
	}

	const hue = Math.abs(hash) % 360;
	const hue2 = (hue + 55) % 360;

	return `linear-gradient(135deg, hsl(${hue} 70% 52%), hsl(${hue2} 68% 42%))`;
}
