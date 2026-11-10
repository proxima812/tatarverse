import { jsonResponse, API_VERSION } from "@/lib/api/catalog";
import { countByCountry } from "@/lib/center/stats";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const prerender = true;

export const GET: APIRoute = async () => {
  const counts = countByCountry(await getCollection("centers"));
  const data = [...counts]
    .sort(([a], [b]) => a.localeCompare(b, "ru"))
    .map(([name, count]) => ({
      name,
      count,
      url: `/api/v1/countries/${encodeURIComponent(name)}.json`,
    }));

  return jsonResponse({
    version: API_VERSION,
    total: data.length,
    data,
  });
};
