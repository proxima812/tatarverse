import { API_URL, type PublicCenterCard, type PublicCenterItem } from "@/lib/tvapi/client";

/**
 * API каталога со стороны сервера: страница центра рендерится по запросу (Cloudflare Workers) прямо из
 * `GET /centers/{code}` - одна страница на все центры, новые и поправленные видны сразу, а поисковики
 * получают готовый HTML.
 *
 * Ответы API кешируются на краю Cloudflare (`cf.cacheTtl`): сервер API видит не больше запроса в минуту
 * на адрес и точку присутствия, правка модератора доходит до страницы за минуту.
 *
 * API ограничивает частоту (429 при всплеске - например, когда сайт обходит поисковик), поэтому ошибку
 * повторяем с паузой, а последний удачный ответ держим неделю в Cache API: если API так и не ответило,
 * страница строится из него, а не отдаёт 503.
 */

const EDGE_CACHE_SECONDS = 60;
const STALE_SECONDS = 7 * 24 * 60 * 60;
/** Паузы перед повторами, мс. */
const RETRY_DELAYS = [300, 1200];

/** API не ответило или ответило ошибкой (кроме 404 - «такого центра нет»). */
export class CatalogUnavailable extends Error {}

/** Кеш Workers; вне них (сборка в Node) - нет, и запасной копии просто не будет. */
const edgeCache = () => (globalThis as { caches?: { default?: Cache } }).caches?.default ?? null;
/** Ключ запасной копии - отдельный адрес: под самим адресом лежит минутная копия `cf.cacheTtl`. */
const staleKey = (url: string) => `${url}${url.includes("?") ? "&" : "?"}stale=1`;

async function remember(url: string, body: string) {
	try {
		await edgeCache()?.put(
			staleKey(url),
			new Response(body, {
				headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${STALE_SECONDS}` },
			}),
		);
	} catch {
		// Запасная копия - не повод ронять страницу.
	}
}

async function recall<T>(url: string): Promise<T | null> {
	try {
		const cached = await edgeCache()?.match(staleKey(url));
		return cached ? ((await cached.json()) as T) : null;
	} catch {
		return null;
	}
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function get<T>(path: string): Promise<T | null> {
	const url = `${API_URL}${path}`;
	let failure = "";
	for (const delay of [0, ...RETRY_DELAYS]) {
		if (delay) await pause(delay);
		let response: Response;
		try {
			response = await fetch(url, {
				headers: { Accept: "application/json" },
				// Свойство рантайма Workers: кешировать и JSON, а не только статику. Вне Workers не мешает.
				cf: { cacheTtl: EDGE_CACHE_SECONDS, cacheEverything: true },
			} as RequestInit);
		} catch (error) {
			failure = `не ответило: ${(error as Error).message}`;
			continue;
		}
		if (response.status === 404) return null;
		if (response.ok) {
			const body = await response.text();
			// Ответ из минутного кеша уже запомнен, когда пришёл от API.
			if (response.headers.get("cf-cache-status") !== "HIT") await remember(url, body);
			return JSON.parse(body) as T;
		}
		failure = `ответило ${response.status}`;
		// Повторять есть смысл только «подождите» и сбои сервера; прочие 4xx не пройдут и со второго раза.
		if (response.status !== 429 && response.status < 500) break;
	}
	const stale = await recall<T>(url);
	if (stale) return stale;
	throw new CatalogUnavailable(`API каталога ${failure} на ${path}`);
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
