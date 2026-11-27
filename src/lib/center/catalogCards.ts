import { resolveCenterGeo, type CenterGeo } from "@/data/geo";
import { countryFlagsByRu } from "@/data/worldCountries";
import { catalogVersion, centerData, type CatalogVersion, type ExportCard } from "@/lib/center/apiCard";
import { getCenterPath } from "@/lib/center/centers";
import type { CenterFacetRecord } from "@/lib/center/facets";
import { centerRouteNumber } from "@/lib/center/routeId";
import type { CardFields } from "@/lib/site/cardAttributes";

/**
 * Карточки каталога `/centers` - единственное правило, как центр становится
 * карточкой в сетке, чипом в фильтрах и строкой в поиске.
 *
 * Работает в трёх местах: на сборке (снимок из mdx), в функции Pages
 * (свежая выгрузка API на каждый запрос) и в браузере (запасной путь, когда
 * функции нет - `astro dev`). Поэтому вход - не `CollectionEntry` и не
 * `ExportCard`, а общий для них вид полей центра.
 *
 * Модуль попадает в клиентский бандл и в функцию: никаких Node- и DOM-API.
 */

/** Поля центра, общие для frontmatter коллекции и `centerData` из API. */
export interface CenterSourceData {
	title?: string;
	type?: string;
	category?: string;
	summary?: string;
	pubDate?: string;
	updatedAt?: string;
	location?: { country?: string; region?: string; district?: string; city?: string };
}

export interface CatalogSource {
	id: string;
	/** Русская запись: по ней считается география на всех языках. */
	ru: CenterSourceData;
	/** Запись на языке карточки. Нет - показываем русскую. */
	shown?: CenterSourceData;
}

export interface CatalogCard extends CardFields {
	district: string;
	/** Город и регион на языке карточки: «Sydney» на /en ищется, хотя фильтр - по-русски. */
	localTerms: string[];
	/** Адрес, по которому карточка открывается: с префиксом локали и слешем. */
	linkHref: string;
	updatedAt: string;
}

export interface CatalogPayload {
	/** Язык текстов карточек, а не страницы: см. `cardLocaleFor`. */
	cardLocale: CardLocale;
	version: CatalogVersion;
	/** `true` - выгрузка API на момент запроса, `false` - снимок сборки. */
	live: boolean;
	cards: CatalogCard[];
}

export type CardLocale = "ru" | "en";

/**
 * Карточки переведены только на английский: татарский каталог показывает
 * русский текст карточек и ведёт на русские страницы центров.
 */
export const cardLocaleFor = (locale: string): CardLocale => (locale === "en" ? "en" : "ru");

const pubTime = (source: CatalogSource) => (source.ru.pubDate ? Date.parse(source.ru.pubDate) || 0 : 0);

/** Тот же порядок, что `byRecency`: свежие сверху, номер `tbk-N` - тай-брейк. */
const byRecency = (a: CatalogSource, b: CatalogSource) =>
	pubTime(b) - pubTime(a) || centerRouteNumber(b.id) - centerRouteNumber(a.id);

function toCard({ id, ru, shown }: CatalogSource, cardLocale: CardLocale): CatalogCard {
	const geo = resolveCenterGeo(ru.location);
	const data = shown ?? ru;
	const href = getCenterPath(id);
	const localTerms = [data.location?.city, data.location?.region]
		.map((value) => value?.trim() ?? "")
		.filter(Boolean);

	return {
		id,
		scope: geo.scope,
		macro: geo.macro,
		okrug: geo.okrug,
		country: geo.country || "Прочее",
		region: geo.region,
		city: geo.city,
		district: geo.district,
		type: data.type ?? "",
		category: data.category ?? "",
		title: data.title?.trim() || id,
		summary: data.summary?.trim() ?? "",
		flag: geo.country ? (countryFlagsByRu[geo.country] ?? "") : "",
		pubDate: ru.pubDate ?? "",
		href,
		localTerms,
		// Страница под /en/ есть только у переведённой карточки.
		linkHref: `${cardLocale === "en" && shown ? "/en" : ""}${href}/`,
		updatedAt: ru.updatedAt ?? "",
	};
}

export function buildCatalogPayload(
	sources: readonly CatalogSource[],
	cardLocale: CardLocale,
	live: boolean,
): CatalogPayload {
	return {
		cardLocale,
		live,
		version: catalogVersion(sources.map((source) => source.ru.updatedAt)),
		cards: [...sources].sort(byRecency).map((source) => toCard(source, cardLocale)),
	};
}

/** Выгрузка API (`GET /centers/export`) → источники карточек. */
export function exportSources(
	ru: readonly ExportCard[],
	shown: readonly ExportCard[] | null,
	cardLocale: CardLocale,
): CatalogSource[] {
	const shownById = new Map((shown ?? []).map((card) => [card.id, card]));

	return ru.map((card) => {
		const translated = shownById.get(card.id);
		return {
			id: card.id,
			ru: centerData(card, "ru"),
			// Переводом считаем только карточку с собственным названием на языке.
			shown:
				cardLocale !== "ru" && translated?.name?.[cardLocale]?.text?.trim()
					? centerData(translated, cardLocale)
					: undefined,
		};
	});
}

/** География карточки в виде, который ждут `buildCenterFacets` и `CenterCard`. */
export const cardGeo = (card: CatalogCard): CenterGeo => ({
	scope: card.scope as CenterGeo["scope"],
	macro: card.macro,
	okrug: card.okrug,
	country: card.country === "Прочее" ? "" : card.country,
	region: card.region,
	city: card.city,
	district: card.district,
});

export const facetRecords = (cards: readonly CatalogCard[]): CenterFacetRecord[] =>
	cards.map((card) => ({ id: card.id, category: card.category, ...cardGeo(card) }));

/**
 * JSON для `<script type="application/json">`: `<` экранируем, иначе
 * `</script>` в описании центра закрыл бы тег.
 */
export const payloadScript = (payload: CatalogPayload) =>
	JSON.stringify(payload).replace(/</g, "\\u003c");
