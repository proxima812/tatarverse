import { resolveCenterGeo } from "@/data/geo";
import { countryFlagsByRu, getCountryLabel } from "@/data/worldCountries";
import type { AppLocale } from "@/i18n";
import {
	catalogVersion,
	centerData,
	sameVersion,
	type CatalogVersion,
	type ExportCard,
	type ExportResponse,
} from "@/lib/center/apiCard";
import { getCenterPath } from "@/lib/center/centers";
import { CARD_ATTR, CARD_PART, readCard, type CardFields } from "@/lib/site/cardAttributes";
import { fillCard } from "@/lib/site/cardTemplate";

/**
 * Живой каталог: правка, одобренная в API, видна на `/centers` сразу,
 * без пересборки сайта.
 *
 * Страница собрана со снимком карточек и знает его версию (сколько карточек,
 * когда правили последнюю). Скрипт сверяет её с `GET /stats` - это один
 * маленький запрос. Совпало - ничего не делаем. Разошлось - качаем выгрузку
 * и подменяем в сетке изменившиеся карточки, добавляем новые и убираем
 * скрытые. Фильтры запускаются уже по обновлённой сетке.
 */

const API = "https://api.tatarverse.cc";
const STATS_TIMEOUT_MS = 2500;
const EXPORT_TIMEOUT_MS = 10000;

async function getJson<T>(url: string, timeout: number): Promise<T> {
	const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(timeout) });
	if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
	return (await response.json()) as T;
}

async function fetchCards(lang: string): Promise<ExportCard[]> {
	const body = await getJson<ExportResponse>(`${API}/centers/export?lang=${lang}`, EXPORT_TIMEOUT_MS);
	if (!Array.isArray(body.data) || body.data.length === 0) throw new Error("пустая выгрузка");
	return body.data;
}

/** Поля карточки по тем же правилам, что `CenterCard.astro` на сборке. */
function cardFields(source: ExportCard, shown: ExportCard, locale: string): CardFields {
	// География - всегда по русской записи, как и в собранном каталоге.
	const geo = resolveCenterGeo(centerData(source, "ru").location);
	const data = centerData(shown, locale);
	const country = geo.country || "Прочее";

	return {
		id: source.id,
		scope: geo.scope,
		macro: geo.macro,
		okrug: geo.okrug,
		country,
		region: geo.region,
		city: geo.city,
		type: data.type ?? "",
		category: data.category ?? "",
		title: data.title,
		summary: data.summary ?? "",
		flag: geo.country ? (countryFlagsByRu[geo.country] ?? "") : "",
		pubDate: data.pubDate ?? "",
		href: getCenterPath(source.id),
	};
}

const sameFields = (left: CardFields, right: CardFields) =>
	(Object.keys(left) as (keyof CardFields)[]).every((key) => left[key] === right[key]);

function renderCard(
	template: HTMLTemplateElement,
	fields: CardFields,
	locale: string,
	linkHref: string,
): HTMLElement | null {
	// На карточке страна подписана на языке страницы, без «Прочее»;
	// в атрибуте остаётся русский ключ фильтра.
	const shownCountry = fields.country === "Прочее" ? "" : getCountryLabel(fields.country, locale as AppLocale);
	const node = fillCard(template, { ...fields, country: shownCountry }, { locale, linkHref });
	const article = node?.querySelector<HTMLElement>(`[${CARD_ATTR.id}]`);
	article?.setAttribute(CARD_ATTR.country, fields.country);
	return article ?? null;
}

export async function syncLiveCatalog(): Promise<void> {
	const root = document.querySelector<HTMLElement>("[data-live-catalog]");
	const grid = document.getElementById("cards-grid");
	const template = root?.querySelector<HTMLTemplateElement>("template");
	if (!root || !grid || !template) return;

	const locale = root.dataset.locale ?? "ru";
	const built = JSON.parse(root.dataset.version ?? "{}") as CatalogVersion;

	const stats = await getJson<{ data?: { count?: number; updatedAt?: string | null } }>(
		`${API}/stats`,
		STATS_TIMEOUT_MS,
	);
	const live: CatalogVersion = { count: stats.data?.count ?? 0, updatedAt: stats.data?.updatedAt ?? null };
	if (sameVersion(built, live)) return;

	const [source, shown] = await Promise.all([
		fetchCards("ru"),
		locale === "ru" ? Promise.resolve(null) : fetchCards(locale),
	]);
	const shownById = new Map((shown ?? []).map((card) => [card.id, card]));

	const existing = new Map(
		Array.from(grid.querySelectorAll<HTMLElement>(`:scope > [${CARD_ATTR.id}]`)).map((element) => [
			element.getAttribute(CARD_ATTR.id) ?? "",
			element,
		]),
	);

	// Новые карточки - в начало: сетка собрана от свежих к старым.
	const fresh: HTMLElement[] = [];
	for (const card of source) {
		const fields = cardFields(card, shownById.get(card.id) ?? card, locale);
		const current = existing.get(card.id);
		existing.delete(card.id);
		if (current && sameFields(readCard(current), fields)) continue;

		// Ссылку собранной карточки не трогаем: под /en/ страница есть только у переведённых.
		const linkHref =
			current?.querySelector(`[${CARD_PART.link}]`)?.getAttribute("href") ??
			`${locale === "ru" || !shownById.get(card.id)?.name?.[locale]?.text ? "" : `/${locale}`}${fields.href}/`;
		const article = renderCard(template, fields, locale, linkHref);
		if (!article) continue;
		if (current) current.replaceWith(article);
		else fresh.push(article);
	}
	grid.prepend(...fresh);

	// Чего нет в выгрузке, то модераторы скрыли.
	for (const element of existing.values()) element.remove();

	root.dataset.version = JSON.stringify(catalogVersion(source.map((card) => card.updatedAt ?? undefined)));
}
