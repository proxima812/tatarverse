import { getCountryLabel } from "@/data/worldCountries";
import { createCenterRouteIdMap } from "@/lib/center/centers";
import { renderCenterOgImage } from "@/lib/og/centerOgImage";
import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";

export async function getStaticPaths() {
	const entries = await getCollection("centers");
	const routeIds = createCenterRouteIdMap(entries);
	return entries.map((entry) => ({ params: { id: routeIds.get(entry.id) ?? entry.id }, props: { entry } }));
}

const clean = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

export const GET: APIRoute = async ({ props }) => {
	const { data } = (props as { entry: CollectionEntry<"centers"> }).entry;
	const country = clean(data.location?.country);
	const png = await renderCenterOgImage({
		title: clean(data.title) ?? "tatarverse",
		place: [clean(data.location?.city), country ? getCountryLabel(country, "ru") : null].filter(Boolean).join(", ") || null,
		tags: [clean(data.category), clean(data.type)].filter((v): v is string => Boolean(v)),
	});
	return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
