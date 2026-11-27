import { sameVersion } from "@/lib/center/apiCard";
import { fetchCatalogVersion, fetchLiveCatalog } from "@/lib/center/catalogApi";
import { cardLocaleFor, type CardLocale, type CatalogPayload } from "@/lib/center/catalogCards";

/**
 * Свежий каталог для функций Pages: `/centers` и `/api/centers.json`.
 *
 * Выгрузка API весит под мегабайт и строится секунды, поэтому готовые
 * карточки лежат в кеше Cloudflare (Cache API, у каждого дата-центра свой).
 * Пока запись моложе `FRESH_MS`, отдаём её сразу. Старше - сверяем версию с
 * `GET /stats` (один маленький запрос): совпала - продлеваем запись,
 * разошлась - качаем выгрузку заново. Так правка, одобренная модератором,
 * видна через считанные секунды, а API не получает выгрузку на каждый показ.
 *
 * API не ответил - отдаём последнюю запись, сколько бы ей ни было. Нет и её -
 * бросаем: страница тогда останется на снимке сборки.
 */

const FRESH_MS = 15_000;
const STATS_TIMEOUT_MS = 1_500;
/** Сколько Cloudflare хранит запись. Это запас на падение API, а не свежесть. */
const KEEP_SECONDS = 7 * 24 * 60 * 60;
/** Поменяли форму карточки - меняем версию, чтобы не читать старые записи. */
const CACHE_VERSION = "1";
const FETCHED_AT = "X-Catalog-Fetched-At";

type WaitUntil = (promise: Promise<unknown>) => void;

const cacheKey = (cardLocale: CardLocale) =>
	new Request(`https://tatarverse.cc/__catalog/${cardLocale}?v=${CACHE_VERSION}`);

function cacheEntry(payload: CatalogPayload) {
	return new Response(JSON.stringify(payload), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": `public, max-age=${KEEP_SECONDS}`,
			[FETCHED_AT]: String(Date.now()),
		},
	});
}

// Cache API есть только в рантайме Cloudflare: в типах проекта его нет.
const edgeCache = () => (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;

export async function getCatalogPayload(locale: string, waitUntil: WaitUntil): Promise<CatalogPayload> {
	const cardLocale = cardLocaleFor(locale);
	const cache = edgeCache();
	const key = cacheKey(cardLocale);
	const cached = await cache?.match(key);

	if (!cached || !cache) {
		const payload = await fetchLiveCatalog(cardLocale);
		if (cache) waitUntil(cache.put(key, cacheEntry(payload)));
		return payload;
	}

	const payload = (await cached.json()) as CatalogPayload;
	const age = Date.now() - Number(cached.headers.get(FETCHED_AT) ?? 0);
	if (age < FRESH_MS) return payload;

	try {
		if (sameVersion(payload.version, await fetchCatalogVersion(STATS_TIMEOUT_MS))) {
			waitUntil(cache.put(key, cacheEntry(payload)));
			return payload;
		}
		const fresh = await fetchLiveCatalog(cardLocale);
		waitUntil(cache.put(key, cacheEntry(fresh)));
		return fresh;
	} catch (error) {
		console.warn("[catalog] API недоступен, отдаём кеш", error);
		return payload;
	}
}
