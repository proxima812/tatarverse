import centersMeta from "@/data/centers.meta.json";

/**
 * Каталог по сводке выгрузки (`src/data/centers.meta.json`, scripts/sync-centers.ts): соседи «от свежих» и
 * похожие центры для страницы центра, которая рендерится по запросу. Правила - как были у собранных
 * страниц (byRecency и relatedCenters): соседи по дате, похожие - та же страна, у центров без страны -
 * тот же народ, четыре самых свежих. Центр, одобренный после выгрузки, в сводке появится со следующей.
 */

export interface MetaCenter {
	id: string;
	title: string;
	country: string | null;
	category: string | null;
	city: string | null;
	titleEn: string | null;
	cityEn: string | null;
}

export interface CenterLinkItem {
	id: string;
	title: string;
	city: string | null;
}

const centers = centersMeta.centers as MetaCenter[];
const RELATED_LIMIT = 4;
const snapshotIds = new Set(centers.map((center) => center.id));

/**
 * Центр есть в выгрузке - значит, при сборке у него появились OG-картинка (`/og/centers/tbk-N.png`) и
 * Markdown-двойник (`/centers/tbk-N.md`). У одобренного позже их до следующей сборки нет.
 */
export const inSnapshot = (code: string) => snapshotIds.has(code);

const localized = (center: MetaCenter, lang: string): CenterLinkItem => ({
	id: center.id,
	title: (lang === "en" && center.titleEn) || center.title,
	city: (lang === "en" ? center.cityEn : null) ?? center.city,
});

/** Соседи и похожие; null - центра в сводке ещё нет. */
export function catalogNeighbours(code: string, lang: string) {
	const index = centers.findIndex((center) => center.id === code);
	if (index < 0) return null;
	const center = centers[index];
	const isRelated = (candidate: MetaCenter) =>
		candidate.id !== code &&
		(center.country
			? candidate.country === center.country
			: Boolean(center.category) && candidate.category === center.category);

	return {
		// Подписи соседей - русские названия, как у собранной листалки.
		previous: index > 0 ? localized(centers[index - 1], "ru") : null,
		next: index < centers.length - 1 ? localized(centers[index + 1], "ru") : null,
		related: centers.filter(isRelated).slice(0, RELATED_LIMIT).map((item) => localized(item, lang)),
	};
}
