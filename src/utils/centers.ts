import type { CollectionEntry } from "astro:content";

const CENTER_ROUTE_PREFIX = "tbk-";
const CENTER_ROUTE_ID_PATTERN = /^tbk-\d+$/;

export const getCenterPath = (routeId: string) => `/centers/${routeId}`;

export const createCenterRouteIdMap = (entries: CollectionEntry<"centers">[]) => {
	const sortedEntries = [...entries].sort((a, b) => {
		const aRouteNumber = a.id.match(CENTER_ROUTE_ID_PATTERN)?.[0].slice(CENTER_ROUTE_PREFIX.length);
		const bRouteNumber = b.id.match(CENTER_ROUTE_ID_PATTERN)?.[0].slice(CENTER_ROUTE_PREFIX.length);

		if (aRouteNumber && bRouteNumber) {
			return Number(aRouteNumber) - Number(bRouteNumber);
		}

		return a.id.localeCompare(b.id, "en");
	});

	return new Map(
		sortedEntries.map((entry, index) => [
			entry.id,
			CENTER_ROUTE_ID_PATTERN.test(entry.id) ? entry.id : `${CENTER_ROUTE_PREFIX}${index + 1}`,
		]),
	);
};
