import { API_URL, type PublicCenterCard, type PublicCenterItem } from "@/lib/tvapi/client";

/**
 * API каталога со стороны сервера: страница центра рендерится по запросу (Cloudflare Workers) прямо из
 * `GET /centers/{code}` - одна страница на все центры, новые и поправленные видны сразу, а поисковики
 * получают готовый HTML.
 *
 * Ответы API кешируются на краю Cloudflare (`cf.cacheTtl`): сервер API видит не больше запроса в минуту
 * на адрес и точку присутствия, правка модератора доходит до страницы за минуту.
 */

const EDGE_CACHE_SECONDS = 60;

/** API не ответило или ответило ошибкой (кроме 404 - «такого центра нет»). */
export class CatalogUnavailable extends Error {}

async function get<T>(path: string): Promise<T | null> {
	let response: Response;
	try {
		response = await fetch(`${API_URL}${path}`, {
			headers: { Accept: "application/json" },
			// Свойство рантайма Workers: кешировать и JSON, а не только статику. Вне Workers не мешает.
			cf: { cacheTtl: EDGE_CACHE_SECONDS, cacheEverything: true },
		} as RequestInit);
	} catch (error) {
		throw new CatalogUnavailable(`API каталога не ответило: ${(error as Error).message}`);
	}
	if (response.status === 404) return null;
	if (!response.ok) throw new CatalogUnavailable(`API каталога ответило ${response.status} на ${path}`);
	return (await response.json()) as T;
}

/** Карточка центра на языке страницы (без перевода - по-русски); null - такого центра нет или он скрыт. */
export async function fetchCenter(code: string, lang: string): Promise<PublicCenterCard | null> {
	const body = await get<{ data: PublicCenterCard }>(`/centers/${encodeURIComponent(code)}?lang=${lang}`);
	return body?.data ?? null;
}

/** Похожие центры: та же страна, у онлайн-центров без страны - тот же народ. Ошибка - просто без них. */
export async function fetchRelated(card: PublicCenterCard, lang: string, limit: number): Promise<PublicCenterItem[]> {
	const country = card.location?.countryCode;
	const filter = country ? `country=${encodeURIComponent(country)}` : `category=${encodeURIComponent(card.categoryCode)}`;
	try {
		const slice = await get<{ data: PublicCenterItem[] }>(`/centers?lang=${lang}&${filter}&limit=${limit + 1}`);
		return (slice?.data ?? []).filter((item) => item.id !== card.id).slice(0, limit);
	} catch {
		return [];
	}
}
