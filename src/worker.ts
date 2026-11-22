import { handle } from "@astrojs/cloudflare/handler";
import {
	AEO_SPEC_VERSION,
	detectAIBot,
	estimateTokens,
	negotiateFormat,
	toMarkdownPath,
} from "@dualmark/core";
import redirectsFile from "../public/_redirects?raw";

/**
 * Воркер сайта на Cloudflare Workers (wrangler.jsonc → main). Всё, что раньше делали функции
 * Cloudflare Pages (`functions/`), - здесь, поверх обработчика Astro:
 *
 * - `/api/geo.json` - страна и город посетителя по IP (Cloudflare кладёт их в `request.cf`) для
 *   страницы «Центры рядом»: без ключей и сторонних сервисов, разрешения не спрашиваем;
 * - согласование форматов по AEO Spec v1.0: ботам и клиентам с `Accept: text/markdown` - Markdown-двойник
 *   страницы (`/centers/tbk-1.md` и т. п. собирает @dualmark/astro), у прямых `.md` - заголовки, которые
 *   считаются на каждый запрос (`X-Markdown-Tokens`);
 * - переадресации из `public/_redirects`: при `run_worker_first` запрос приходит сюда раньше, чем их
 *   применила бы статика Cloudflare, поэтому они разбираются здесь;
 * - файлы (путь с расширением) - сразу из статики: иначе `/og/centers/tbk-1.png` поймал бы маршрут
 *   `[locale]/centers/[id]` (locale = «og») и ответил 404;
 * - остальное - Astro: статика сборки из ASSETS и страница центра, которая рендерится по запросу.
 *
 * Воркер запускается первым для всех адресов, кроме `/_astro/*` (`run_worker_first`), - иначе статические
 * страницы уходили бы мимо согласования.
 */

interface Env {
	ASSETS: { fetch(request: Request): Promise<Response> };
}

type Context = Parameters<typeof handle>[2];

const MARKDOWN_TYPE = "text/markdown; charset=utf-8";

/**
 * Отдавать ли markdown публичным кешам. Cloudflare исторически учитывает только `Vary: Accept-Encoding`,
 * поэтому вариант, выбранный по Accept/User-Agent, кешировать на общем CDN опасно: браузер мог бы получить
 * markdown из кеша, оставленного ботом. Прямые .md-адреса однозначны и кешируются нормально.
 */
const DIRECT_CACHE_CONTROL = "public, max-age=3600";
const NEGOTIATED_CACHE_CONTROL = "no-store";

/** Страница, а не ассет: у последнего сегмента нет расширения. */
function isDocumentPath(pathname: string) {
	if (pathname.startsWith("/_astro/")) return false;
	const lastSegment = pathname.split("/").pop() ?? "";
	return !lastSegment.includes(".");
}

/** Явная просьба про HTML уважается даже от бота. */
const mentionsHtml = (accept: string | null) => /text\/html|application\/xhtml\+xml/i.test(accept ?? "");

function markdownResponse(request: Request, body: string, negotiated: boolean) {
	return new Response(request.method === "HEAD" ? null : body, {
		status: 200,
		headers: {
			"Content-Type": MARKDOWN_TYPE,
			"Cache-Control": negotiated ? NEGOTIATED_CACHE_CONTROL : DIRECT_CACHE_CONTROL,
			"X-Content-Type-Options": "nosniff",
			// Спека требует положительное целое: лучше 1, чем 0 и проваленная проверка.
			"X-Markdown-Tokens": String(Math.max(1, estimateTokens(body))),
			"X-AEO-Version": AEO_SPEC_VERSION,
			"X-Robots-Tag": "noindex",
			Vary: negotiated ? "Accept, User-Agent" : "Accept",
		},
	});
}

/** Статический файл в обход текущего запроса: нужен GET и для HEAD, иначе токены считать не из чего. */
const fetchAsset = (env: Env, url: URL) => env.ASSETS.fetch(new Request(url.toString(), { method: "GET" }));

function withAeoHeaders(response: Response) {
	const headers = new Headers(response.headers);
	headers.set("X-AEO-Version", AEO_SPEC_VERSION);
	// Представление зависит и от Accept, и от User-Agent - говорим об этом честно.
	headers.set("Vary", "Accept, User-Agent");
	return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

/** Правило `_redirects`: точный путь или префикс с `*` на конце (`/catalog/*`). */
interface RedirectRule {
	from: string;
	splat: boolean;
	to: string;
	status: number;
}

const redirectRules: RedirectRule[] = redirectsFile
	.split("\n")
	.map((line) => line.trim())
	.filter((line) => line && !line.startsWith("#"))
	.map((line) => {
		const [from = "", to = "", status] = line.split(/\s+/);
		const splat = from.endsWith("*");
		return { from: splat ? from.slice(0, -1) : from, splat, to, status: Number(status) || 302 };
	});

function redirectFor(url: URL): Response | null {
	const rule = redirectRules.find((candidate) =>
		candidate.splat ? url.pathname.startsWith(candidate.from) : url.pathname === candidate.from,
	);
	if (!rule) return null;
	return new Response(null, { status: rule.status, headers: { Location: new URL(rule.to, url).toString() } });
}

/** «Центры рядом»: страна и город по IP. T1 (Tor) и XX (не определил) - пусто, а не случайная страна. */
function geoResponse(request: Request) {
	const cf = (request as Request & { cf?: Record<string, unknown> }).cf ?? {};
	const clean = (value: unknown) => (typeof value === "string" ? value.trim() : "");
	const country = clean(cf.country).toUpperCase();
	const body = {
		country: country === "T1" || country === "XX" ? "" : country,
		city: clean(cf.city),
		region: clean(cf.region),
	};
	return new Response(JSON.stringify(body), {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			// Ответ зависит от IP: общий кеш отдал бы одному посетителю местоположение другого.
			"Cache-Control": "no-store",
			"X-Robots-Tag": "noindex",
		},
	});
}

export default {
	async fetch(request: Request, env: Env, context: Context): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname === "/api/geo.json" && (request.method === "GET" || request.method === "HEAD")) {
			return geoResponse(request);
		}
		if (request.method !== "GET" && request.method !== "HEAD") return handle(request, env, context);

		const redirect = redirectFor(url);
		if (redirect) return redirect;

		// Прямой запрос двойника: тело уже в статике, добиваем заголовки рантайма.
		if (url.pathname.endsWith(".md")) {
			const asset = await fetchAsset(env, url);
			if (asset.ok) return markdownResponse(request, await asset.text(), false);
			return handle(request, env, context);
		}

		if (!isDocumentPath(url.pathname)) {
			const asset = await env.ASSETS.fetch(request);
			return asset.status === 404 ? handle(request, env, context) : asset;
		}

		const accept = request.headers.get("Accept");
		const format = negotiateFormat(accept ?? "");
		// Клиент не принимает ни HTML, ни markdown, ни wildcard.
		if (format === null) {
			return new Response("Not Acceptable\n", {
				status: 406,
				headers: { "Content-Type": "text/plain; charset=utf-8", Vary: "Accept", "X-AEO-Version": AEO_SPEC_VERSION },
			});
		}

		const bot = detectAIBot(request.headers.get("User-Agent") ?? "");
		if (format === "markdown" || (bot.isBot && !mentionsHtml(accept))) {
			const asset = await fetchAsset(env, new URL(toMarkdownPath(url.pathname), url));
			if (asset.ok) return markdownResponse(request, await asset.text(), true);
			// Двойника у страницы нет - молча отдаём HTML.
		}

		return withAeoHeaders(await handle(request, env, context));
	},
};
