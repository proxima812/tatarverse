import type { CollectionEntry } from "astro:content";

const CENTER_ROUTE_PREFIX = "tbk-";

export const getCenterPath = (routeId: string) => `/centers/${routeId}`;

export const createCenterRouteIdMap = (entries: CollectionEntry<"centers">[]) => {
	const sortedEntries = [...entries].sort((a, b) => a.id.localeCompare(b.id, "en"));

	return new Map(
		sortedEntries.map((entry, index) => [entry.id, `${CENTER_ROUTE_PREFIX}${index + 1}`]),
	);
};
