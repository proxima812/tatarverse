import type { CatalogVersion, ExportCard, ExportResponse } from "@/lib/center/apiCard";
import {
	buildCatalogPayload,
	exportSources,
	type CardLocale,
	type CatalogPayload,
} from "@/lib/center/catalogCards";

/**
 * Запросы каталога к API - общие для функции Pages и браузера.
 *
 * Модуль попадает в клиентский бандл и в функцию: только `fetch`.
 */

const API = "https://api.tatarverse.cc";
const EXPORT_TIMEOUT_MS = 8_000;

async function getJson<T>(url: string, timeout: number): Promise<T> {
	const response = await fetch(url, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(timeout),
	});
	if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
	return (await response.json()) as T;
}

async function fetchExport(lang: CardLocale): Promise<ExportCard[]> {
	const body = await getJson<ExportResponse>(`${API}/centers/export?lang=${lang}`, EXPORT_TIMEOUT_MS);
	if (!Array.isArray(body.data) || body.data.length === 0) throw new Error("пустая выгрузка");
	return body.data;
}

/** Версия каталога в API: сколько карточек и когда правили последнюю. */
export async function fetchCatalogVersion(timeout: number): Promise<CatalogVersion> {
	const body = await getJson<{ data?: { count?: number; updatedAt?: string | null } }>(`${API}/stats`, timeout);
	return { count: body.data?.count ?? 0, updatedAt: body.data?.updatedAt ?? null };
}

/** Каталог прямо из выгрузки API, без кеша. */
export async function fetchLiveCatalog(cardLocale: CardLocale): Promise<CatalogPayload> {
	const [ru, shown] = await Promise.all([
		fetchExport("ru"),
		cardLocale === "ru" ? Promise.resolve(null) : fetchExport(cardLocale),
	]);
	return buildCatalogPayload(exportSources(ru, shown, cardLocale), cardLocale, true);
}
