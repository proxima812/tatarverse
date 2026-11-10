import { jsonResponse, serializeCenter, API_VERSION } from "@/lib/api/catalog";
import type { APIRoute, GetStaticPaths } from "astro";
import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () =>
  (await getCollection("centers")).map((center) => ({
    params: { id: center.id },
    props: { center },
  }));

export const GET: APIRoute = ({ props }) => {
  const center = props.center as CollectionEntry<"centers">;
  return jsonResponse({
    version: API_VERSION,
    data: serializeCenter(center, "ru"),
  });
};
