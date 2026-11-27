import { sameVersion } from "@/lib/center/apiCard";
import { fetchCatalogVersion, fetchLiveCatalog } from "@/lib/center/catalogApi";
import { cardLocaleFor, type CatalogPayload } from "@/lib/center/catalogCards";

/**
 * Откуда каталог берёт карточки.
 *
 * На проде функция Pages кладёт в HTML свежую выгрузку API (`live: true`), и
 * ничего качать не нужно. Если в HTML остался снимок сборки - функция не
 * успела до API или её нет (`astro dev`), - сверяем версию с `GET /stats` и
 * при расхождении берём каталог у функции, а без неё - прямо из API.
 *
 * Возвращает `null`, если на странице нет каталога.
 */

const STATS_TIMEOUT_MS = 2_500;
const FUNCTION_TIMEOUT_MS = 6_000;

function readPayload(root: HTMLElement): CatalogPayload | null {
	const script = root.querySelector<HTMLScriptElement>("script[data-catalog-payload]");
	try {
		return script?.textContent ? (JSON.parse(script.textContent) as CatalogPayload) : null;
	} catch {
		return null;
	}
}

async function fromFunction(locale: string): Promise<CatalogPayload> {
	const response = await fetch(`/api/centers.json?lang=${locale}`, {
		signal: AbortSignal.timeout(FUNCTION_TIMEOUT_MS),
	});
	if (!response.ok) throw new Error(`/api/centers.json: HTTP ${response.status}`);
	return (await response.json()) as CatalogPayload;
}

export async function loadCatalog(): Promise<CatalogPayload | null> {
	const root = document.querySelector<HTMLElement>("[data-live-catalog]");
	if (!root) return null;

	const built = readPayload(root);
	if (built?.live) return built;

	const locale = root.dataset.locale ?? "ru";
	try {
		if (built && sameVersion(built.version, await fetchCatalogVersion(STATS_TIMEOUT_MS))) return built;
		return await fromFunction(locale).catch(() => fetchLiveCatalog(cardLocaleFor(locale)));
	} catch (error) {
		console.warn("[centers] свежий каталог не загрузился, показываем снимок сборки", error);
		return built;
	}
}
