import { getCollection, type CollectionEntry } from "astro:content";
import type { AppLocale } from "@/i18n";

type CenterEntry = CollectionEntry<"centers" | "centersEn">;

export type CenterSearchIndexItem = {
	id: string;
	country: string;
	type: string;
	category: string;
	region: string;
	title: string;
	summary: string;
	city: string;
	searchText: string;
	terms: string[];
	order: number;
};

function normalize(value: string) {
	return value
		.toLowerCase()
		.normalize("NFKD")
		.replace(/\p{Diacritic}/gu, "")
		.replace(/[ё]/g, "е")
		.replace(/[“”«»"']/g, "")
		.trim();
}

function uniqueTerms(terms: string[]) {
	return Array.from(new Set(terms.map((term) => term.trim()).filter((term) => term.length > 1)));
}

function sortByUpdatedDate(entries: CenterEntry[]) {
	return entries.sort((a, b) => {
		return (
			(b.data.pubDate ? new Date(b.data.pubDate).getTime() : 0) -
			(a.data.pubDate ? new Date(a.data.pubDate).getTime() : 0)
		);
	});
}

function toSearchItem(entry: CenterEntry, order: number): CenterSearchIndexItem {
	const country = entry.data.location?.country ?? "Прочее";
	const type = entry.data.type ?? "";
	const category = entry.data.category ?? "";
	const region = entry.data.location?.region ?? "";
	const title = entry.data.title ?? "";
	const summary = entry.data.summary ?? "";
	const city = entry.data.location?.city ?? "";
	const terms = uniqueTerms([title, city, country, region, type, category]);

	return {
		id: entry.id,
		country,
		type,
		category,
		region,
		title,
		summary,
		city,
		terms,
		order,
		searchText: normalize(`${title} ${summary} ${city} ${country} ${type} ${category} ${region}`),
	};
}

export async function getCenterSearchIndex(locale: AppLocale) {
	const localizedCards =
		locale === "en" ? await getCollection("centersEn") : await getCollection("centers");
	const fallbackCards = localizedCards.length > 0 ? localizedCards : await getCollection("centers");

	return sortByUpdatedDate(fallbackCards).map(toSearchItem);
}
