import { getCatalogPayload } from "../../src/lib/server/catalogPayload.ts";

/**
 * Свежий каталог центров JSON-ом: `?lang=ru|en|tt`.
 *
 * Страница `/centers` получает каталог прямо в HTML (`_middleware.js`), сюда
 * браузер приходит, только если в HTML остался снимок сборки - функция не
 * успела достучаться до API. Ответ тот же: кеш функции, потом API.
 */

interface Context {
	request: Request;
	waitUntil(promise: Promise<unknown>): void;
}

export async function onRequestGet(context: Context) {
	const lang = new URL(context.request.url).searchParams.get("lang") ?? "ru";

	try {
		const payload = await getCatalogPayload(lang, (promise) => context.waitUntil(promise));
		return new Response(JSON.stringify(payload), {
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "public, max-age=15",
				"X-Robots-Tag": "noindex",
			},
		});
	} catch (error) {
		console.warn("[catalog] каталог недоступен", error);
		return new Response(JSON.stringify({ error: "catalog unavailable" }), {
			status: 503,
			headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
		});
	}
}
