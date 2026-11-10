import { jsonResponse, serializeCenter, sortCenters, API_VERSION } from "@/lib/api/catalog";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const prerender = true;

export const GET: APIRoute = async () => {
  // English translations are a separate collection and may not cover every Russian entry.
  const centers = sortCenters(await getCollection("centersEn"), "en");
  return jsonResponse({
    version: API_VERSION,
    language: "en",
    total: centers.length,
    data: centers.map((center) => serializeCenter(center, "en")),
  });
};
