import { config } from "@/config";
import type { CollectionEntry } from "astro:content";

export const API_VERSION = "1";
export const CONTENT_LICENSE = "https://creativecommons.org/licenses/by/4.0/";

export type ApiLocale = "ru" | "en";
export type ApiCenter = CollectionEntry<"centers"> | CollectionEntry<"centersEn">;

const collators: Record<ApiLocale, Intl.Collator> = {
  ru: new Intl.Collator("ru"),
  en: new Intl.Collator("en"),
};

/** API responses contain metadata only. Original MDX pages retain full descriptions and citations. */
export function serializeCenter(center: ApiCenter, language: ApiLocale) {
  const data = center.data;
  return {
    id: center.id,
    language,
    title: data.title,
    type: data.type ?? null,
    category: data.category ?? null,
    summary: data.summary ?? null,
    source: data.source ?? null,
    pubDate: data.pubDate ?? null,
    location: data.location ?? null,
    url: new URL(
      `${language === "en" ? "/en" : ""}/centers/${center.id}`,
      config.site.url,
    ).href,
  };
}

export function sortCenters<T extends ApiCenter>(centers: readonly T[], language: ApiLocale): T[] {
  return [...centers].sort((a, b) =>
    collators[language].compare(a.data.title, b.data.title) || a.id.localeCompare(b.id),
  );
}

export function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
