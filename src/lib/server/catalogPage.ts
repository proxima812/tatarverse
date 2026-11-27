import { payloadScript } from "@/lib/center/catalogCards";
import { getCatalogPayload } from "@/lib/server/catalogPayload";

/**
 * Серверная сборка `/centers`: собранная страница + свежий каталог.
 *
 * Страница лежит в Pages статикой: шапка, тулбар, первые карточки и снимок
 * каталога в `<script data-catalog-payload>`. Функция подменяет снимок
 * выгрузкой API на момент запроса, и браузер рендерит тулбар и карточки уже
 * из свежих данных - без второго запроса и без пересборки сайта.
 *
 * Не успели получить каталог - отдаём страницу как есть: на ней снимок, и
 * браузер сам сверится с API.
 */

const CATALOG_PATH = /^\/(?:(en|tt)\/)?centers\/?$/;
const PAYLOAD_TIMEOUT_MS = 2_500;

type WaitUntil = (promise: Promise<unknown>) => void;

interface RewriterElement {
	setInnerContent(content: string, options?: { html?: boolean }): void;
}

// HTMLRewriter есть только в рантайме Cloudflare: в типах проекта его нет.
declare const HTMLRewriter: {
	new (): {
		on(selector: string, handlers: { element(element: RewriterElement): void }): {
			transform(response: Response): Response;
		};
	};
};

/** Локаль страницы каталога или `null`, если адрес - не каталог. */
export function catalogLocale(pathname: string): string | null {
	const match = CATALOG_PATH.exec(pathname);
	return match ? (match[1] ?? "ru") : null;
}

/**
 * Запрос к статике без условных заголовков: иначе Pages ответит 304, и
 * браузер покажет закешированную страницу со старым каталогом.
 */
export function unconditional(request: Request): Request {
	const headers = new Headers(request.headers);
	headers.delete("If-None-Match");
	headers.delete("If-Modified-Since");
	return new Request(request, { headers });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return Promise.race([
		promise,
		new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
	]);
}

export async function withLiveCatalog(
	response: Response,
	locale: string,
	waitUntil: WaitUntil,
): Promise<Response> {
	if (!response.ok || !response.headers.get("Content-Type")?.includes("text/html")) return response;

	let json: string;
	try {
		json = payloadScript(await withTimeout(getCatalogPayload(locale, waitUntil), PAYLOAD_TIMEOUT_MS));
	} catch (error) {
		console.warn("[catalog] страница уходит со снимком сборки", error);
		return response;
	}

	const page = new HTMLRewriter()
		.on("script[data-catalog-payload]", {
			element(element) {
				element.setInnerContent(json, { html: true });
			},
		})
		.transform(response);

	const headers = new Headers(page.headers);
	// Тело теперь своё на каждый запрос: ETag статики соврал бы.
	headers.delete("ETag");
	headers.delete("Last-Modified");
	headers.set("Cache-Control", "no-cache");

	return new Response(page.body, { status: page.status, statusText: page.statusText, headers });
}
