import { getCountryLabel } from "@/data/worldCountries";
import { localizePath, type AppLocale } from "@/i18n";
import { createCenterRouteIdMap, getCenterPath } from "@/lib/center/centers";
import { localizedCenters } from "@/lib/center/collection";

/** Страна не указана: такие карточки печатаются последней группой. */
const UNKNOWN_COUNTRY = "Прочее";

/** `https://www.example.com/x/` → `example.com/x/`: на бумаге схема не нужна. */
function bareUrl(url: string): string {
	return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
}

export interface PrintEntry {
	title: string;
	/** Полная география: город, регион, район, страна — насколько её знает карточка. */
	place: string;
	kind: string;
	/** Адрес карточки без схемы: с бумаги его переписывают руками, `https://` только мешает. */
	href: string;
	/** Собственный сайт или соцсеть центра, тоже без схемы. */
	source: string;
}

export interface PrintCountry {
	/** Русское название страны — ключ группировки и хук для фильтра печати. */
	country: string;
	label: string;
	entries: PrintEntry[];
}

/**
 * Каталог, разложенный по странам для `/centers/print`.
 *
 * Ключ группировки — русское название: по нему сходятся карточки обеих
 * коллекций. На печать уходит уже локализованная подпись.
 */
export async function buildPrintCatalog(
	locale: AppLocale,
	siteUrl: string,
): Promise<{ countries: PrintCountry[]; total: number }> {
	const centers = await localizedCenters(locale);
	const routeIds = createCenterRouteIdMap(centers);
	const groups = new Map<string, PrintEntry[]>();

	for (const center of centers) {
		const country = center.data.location?.country ?? UNKNOWN_COUNTRY;
		const place = [
			center.data.location?.city,
			center.data.location?.district,
			center.data.location?.region,
			center.data.location?.country,
		]
			.filter(Boolean)
			.filter((value, index, list) => list.indexOf(value) === index)
			.join(", ");

		const entry: PrintEntry = {
			title: center.data.title,
			place,
			kind: [center.data.category, center.data.type].filter(Boolean).join(" · "),
			href: bareUrl(
				`${siteUrl}${localizePath(locale, getCenterPath(routeIds.get(center.id) ?? center.id))}`,
			),
			source: center.data.source ? bareUrl(center.data.source) : "",
		};

		const group = groups.get(country);
		if (group) group.push(entry);
		else groups.set(country, [entry]);
	}

	for (const entries of groups.values()) {
		entries.sort(
			(a, b) => a.place.localeCompare(b.place, locale) || a.title.localeCompare(b.title, locale),
		);
	}

	const countries = [...groups.entries()]
		.sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], locale))
		.map(([country, entries]) => ({
			country,
			label: getCountryLabel(country, locale),
			entries,
		}));

	return { countries, total: centers.length };
}
