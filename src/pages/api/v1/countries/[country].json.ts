import { jsonResponse, serializeCenter, sortCenters, API_VERSION } from "@/lib/api/catalog";
import type { APIRoute, GetStaticPaths } from "astro";
import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const grouped = new Map<string, CollectionEntry<"centers">[]>();
  for (const center of await getCollection("centers")) {
    const country = center.data.location?.country;
    if (!country) continue;
    const matches = grouped.get(country) ?? [];
    matches.push(center);
    grouped.set(country, matches);
  }

  return [...grouped].map(([country, centers]) => ({
    params: { country },
    props: { country, centers },
  }));
};

export const GET: APIRoute = ({ props }) => {
  const country = props.country as string;
  const centers = sortCenters(props.centers as CollectionEntry<"centers">[], "ru");
  return jsonResponse({
    version: API_VERSION,
    country,
    total: centers.length,
    data: centers.map((center) => serializeCenter(center, "ru")),
  });
};
