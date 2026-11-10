import { jsonResponse, serializeCenter, sortCenters, API_VERSION } from "@/lib/api/catalog";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const prerender = true;

export const GET: APIRoute = async () => {
  const centers = sortCenters(await getCollection("centers"), "ru");
  return jsonResponse({
    version: API_VERSION,
    language: "ru",
    total: centers.length,
    data: centers.map((center) => serializeCenter(center, "ru")),
  });
};
