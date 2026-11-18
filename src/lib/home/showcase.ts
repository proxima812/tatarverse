import { getBlogEntries } from "@/lib/blog";
import { buildPrintCatalog } from "@/lib/center/print";
import { localizedCenters } from "@/lib/center/collection";
import { getCenterLinks, type CenterLink } from "@/lib/center/links";
import { byRecency } from "@/lib/center/order";
import { getCenterSearchIndex } from "@/lib/center/searchIndex";
import { normalizeSearchText } from "@/lib/center/searchText";
import { getNearbyIndex } from "@/lib/nearby/index";
import type { NearbyIndexItem } from "@/lib/types";
import { countryFlagsByRu, getCountryLabel } from "@/data/worldCountries";
import { resolveCenterGeo } from "@/data/geo";
import type { AppLocale } from "@/i18n";
import { getCollection } from "astro:content";

/**
 * Данные для макетов интерфейса на главной.
 *
 * Макеты рисуют настоящие карточки: названия, города, ссылки и подсказки
 * поиска берутся из каталога на сборке теми же функциями, что и живые
 * страницы. Поменялся каталог - поменялась и картинка, перерисовывать нечего.
 */

export interface ShowcaseCard {
	id: string;
	title: string;
	flag: string;
	city: string;
	country: string;
	category: string;
}

async function showcaseCards(locale: AppLocale): Promise<ShowcaseCard[]> {
	const source = await getCollection("centers");
	const geoById = new Map(source.map((card) => [card.id, resolveCenterGeo(card.data.location)]));

	return byRecency(await localizedCenters(locale)).map((entry) => {
		const geo = geoById.get(entry.id) ?? resolveCenterGeo(entry.data.location);
		return {
			id: entry.id,
			title: entry.data.title ?? "",
			flag: entry.data.location?.flag?.trim() || countryFlagsByRu[geo.country] || "",
			city: geo.city,
			country: geo.country ? getCountryLabel(geo.country, locale) : "",
			category: entry.data.category ?? "",
		};
	});
}

/** Свежие карточки из разных стран: сетка должна говорить «везде», а не «в Казани». */
export async function presentCards(locale: AppLocale, count: number): Promise<ShowcaseCard[]> {
	const picked: ShowcaseCard[] = [];
	const countries = new Set<string>();

	for (const card of await showcaseCards(locale)) {
		if (!card.flag || !card.city || countries.has(card.country)) continue;
		countries.add(card.country);
		picked.push(card);
		if (picked.length === count) break;
	}

	return picked;
}

/** Центр с самым длинным списком каналов: секция про ссылки показывает его. */
export async function linksCenter(
	locale: AppLocale,
): Promise<{ card: ShowcaseCard; links: CenterLink[] } | undefined> {
	const cards = new Map((await showcaseCards(locale)).map((card) => [card.id, card]));
	let best: { card: ShowcaseCard; links: CenterLink[] } | undefined;

	for (const center of await getCollection("centers")) {
		const card = cards.get(center.id);
		if (!card?.flag) continue;
		const links = getCenterLinks(center.body, center.data.source).filter(
			(link) => link.kind !== "maps",
		);
		if (!best || links.length > best.links.length) best = { card, links };
	}

	return best;
}

export interface NearbyShowcase {
	flag: string;
	/** Страна на языке страницы. */
	label: string;
	city: string;
	count: number;
	cities: { name: string; count: number }[];
	cards: NearbyIndexItem[];
}

/**
 * Что увидел бы посетитель из крупнейшего города страны на `/nearby`.
 * Страна - за пределами России: «рядом» интереснее всего там, где своих мало.
 */
export async function nearbyShowcase(
	locale: AppLocale,
	country = "Казахстан",
): Promise<NearbyShowcase | undefined> {
	const items = (await getNearbyIndex(locale)).filter((item) => item.country === country);
	if (items.length === 0) return undefined;

	const byCity = new Map<string, number>();
	for (const item of items) {
		if (item.city) byCity.set(item.city, (byCity.get(item.city) ?? 0) + 1);
	}
	const cities = [...byCity]
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
	const city = cities[0]?.name ?? "";

	return {
		flag: items[0].flag,
		label: items[0].countryLabel,
		city,
		count: items.length,
		cities,
		cards: items.filter((item) => item.city === city),
	};
}

/** Первая страница списка для печати: одна страна, несколько строк. */
export async function printShowcase(locale: AppLocale, siteUrl: string, country = "Кыргызстан") {
	const { countries, total } = await buildPrintCatalog(locale, siteUrl);
	const group = countries.find((item) => item.country === country) ?? countries[0];
	return { group, total, countries: countries.length };
}

/**
 * Подсказки под строкой поиска для запроса `query` - тот же отбор, что в
 * `centersToolbar`: из каждой подходящей карточки берётся термин, где
 * нашёлся запрос, повторы схлопываются. Названия центров пропускаются:
 * секция рассказывает про поиск по странам, городам и регионам.
 */
export async function searchSuggestions(
	locale: AppLocale,
	query: string,
	limit = 5,
): Promise<string[]> {
	const needle = normalizeSearchText(query);
	const values = new Set<string>();

	for (const item of await getCenterSearchIndex(locale)) {
		const term = item.terms.find(
			(candidate) => candidate !== item.title && normalizeSearchText(candidate).includes(needle),
		);
		if (term) values.add(term);
		if (values.size === limit) break;
	}

	return [...values];
}

/** Свежие публикации блога для макета и общее число - для подписи в секции. */
export async function blogShowcase(locale: AppLocale, count = 4) {
	const entries = await getBlogEntries(locale);
	return {
		total: entries.length,
		entries: entries.slice(0, count).map((entry) => ({
			title: entry.data.title,
			format: entry.data.format,
			cover: entry.data.cover ?? "/images/blog/default.svg",
		})),
	};
}
