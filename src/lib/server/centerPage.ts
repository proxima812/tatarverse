import { defaultLocale, type AppLocale } from "@/i18n";
import { apiText } from "@/lib/center/apiCard";
import { catalogNeighbours, type CenterLinkItem } from "@/lib/center/catalogMeta";
import type { PublicCenterCard } from "@/lib/tvapi/client";
import { CatalogUnavailable, fetchCenter, fetchRelated } from "@/lib/server/centerApi";

/**
 * Что отдать по адресу `/centers/{код}/`: страницу, 404, переадресацию или «каталог недоступен».
 * Общая часть `pages/centers/[id].astro` и `pages/[locale]/centers/[id].astro`.
 */

/** Похожих центров в колонке, если центра ещё нет в сводке - как у собранных страниц. */
const RELATED_LIMIT = 4;

/** Браузеру - минута свежести и ещё 10 минут показывать прежнюю, пока проверяет новую. */
export const CENTER_PAGE_CACHE = "public, max-age=60, stale-while-revalidate=600";

export type CenterPage =
	| {
			kind: "page";
			card: PublicCenterCard;
			/** Русская карточка: по ней считается полнота и на других языках - как у собранных страниц. */
			ruCard: PublicCenterCard;
			related: CenterLinkItem[];
			previous: CenterLinkItem | null;
			next: CenterLinkItem | null;
	  }
	| { kind: "missing" }
	| { kind: "redirect"; to: string }
	| { kind: "unavailable" };

export const centerPath = (locale: AppLocale, code: string) =>
	locale === defaultLocale ? `/centers/${code}/` : `/${locale}/centers/${code}/`;

export async function loadCenterPage(rawCode: string | undefined, locale: AppLocale): Promise<CenterPage> {
	const raw = (rawCode ?? "").trim();
	const code = raw.toLowerCase();
	if (!/^(tbk-)?\d+$/.test(code)) return { kind: "missing" };

	try {
		const [card, ruCard] = await Promise.all([
			fetchCenter(code, locale),
			locale === defaultLocale ? null : fetchCenter(code, defaultLocale),
		]);
		if (!card) return { kind: "missing" };
		// Код без «tbk-» или в другом регистре - на постоянный адрес (301).
		if (card.id !== raw) return { kind: "redirect", to: centerPath(locale, card.id) };
		// Соседи и похожие - по сводке выгрузки, как у собранных страниц; нового центра там ещё нет -
		// похожие из API, без листалки.
		const neighbours = catalogNeighbours(card.id, locale);
		const base = { kind: "page" as const, card, ruCard: ruCard ?? card };
		if (neighbours) return { ...base, ...neighbours };
		const related = (await fetchRelated(card, locale, RELATED_LIMIT)).map((item) => ({
			id: item.id,
			title: apiText(item.name, locale) ?? item.id,
			city: apiText(item.location?.city, locale),
		}));
		return { ...base, related, previous: null, next: null };
	} catch (error) {
		if (error instanceof CatalogUnavailable) return { kind: "unavailable" };
		throw error;
	}
}

/**
 * Нет такого центра: пустой ответ 404 - Astro сам отдаст собранную страницу 404.html (она статичная и в
 * воркер не входит, поэтому не Astro.rewrite).
 */
export const notFoundResponse = () => new Response(null, { status: 404 });

/** API каталога не ответило: 503 с Retry-After - поисковик придёт позже, а не выкинет страницу. */
export const unavailableResponse = () =>
	new Response("Каталог временно недоступен, попробуйте через пару минут. / The catalog is temporarily unavailable.", {
		status: 503,
		headers: { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "120" },
	});
