import { jsonResponse, API_VERSION } from "@/lib/api/catalog";
import { catalogStats, countByCountry, withoutCountry } from "@/lib/center/stats";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const prerender = true;

export const GET: APIRoute = async () => {
  const centers = await getCollection("centers");
  const counts = [...countByCountry(centers)]
    .sort(([a], [b]) => a.localeCompare(b, "ru"))
    .map(([country, count]) => ({ country, count }));

  return jsonResponse({
    version: API_VERSION,
    data: {
      ...catalogStats(centers),
      withoutCountry: withoutCountry(centers),
      byCountry: counts,
    },
  });
};
