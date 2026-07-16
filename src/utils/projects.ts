import type { ImageMetadata } from "astro";

const projectAssets = import.meta.glob<{ default: ImageMetadata }>(
	"../assets/projects/**/*.{jpg,jpeg,png,webp}",
	{ eager: true },
);

/**
 * Resolve a project asset (logo/photo) by its relative path inside
 * `src/assets/projects`. Returns `null` when the asset is missing so callers
 * can render a graceful fallback instead of failing the build.
 */
export function getProjectAsset(path?: string): ImageMetadata | null {
	if (!path) return null;

	return projectAssets[`../assets/projects/${path}`]?.default ?? null;
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

	const palettes = [
		[218, 238, 194, 262],
		[276, 306, 334, 248],
		[164, 192, 220, 142],
		[24, 46, 348, 292],
		[202, 226, 252, 176],
		[338, 8, 36, 310],
	] as const;
	const [hue, hue2, hue3, hue4] = palettes[Math.abs(hash) % palettes.length];

	return [
		`radial-gradient(110% 90% at 4% 0%, hsl(${hue} 92% 72% / 0.95), transparent 57%)`,
		`radial-gradient(100% 92% at 100% 8%, hsl(${hue2} 84% 65% / 0.82), transparent 58%)`,
		`radial-gradient(105% 94% at 86% 100%, hsl(${hue3} 78% 57% / 0.72), transparent 62%)`,
		`radial-gradient(96% 90% at 0% 100%, hsl(${hue4} 72% 53% / 0.62), transparent 60%)`,
		`linear-gradient(145deg, hsl(${hue} 56% 42%), hsl(${hue3} 52% 30%))`,
	].join(", ");
}
