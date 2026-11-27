import type { AppLocale } from "@/i18n";
import {
	buildCatalogPayload,
	cardLocaleFor,
	type CatalogPayload,
	type CenterSourceData,
} from "@/lib/center/catalogCards";
import { getCenterTranslationCollection } from "@/lib/center/centers";
import { getCollection } from "astro:content";

/**
 * Каталог на момент сборки - из mdx-снимка API.
 *
 * На проде его подменяет свежая выгрузка (`functions/_middleware.js`), а
 * снимок остаётся для `astro dev`, для поисковиков без JS и на случай, если
 * API и кеш функции недоступны одновременно.
 */
export async function catalogSnapshot(locale: AppLocale): Promise<CatalogPayload> {
	const cardLocale = cardLocaleFor(locale);
	const translationCollection = getCenterTranslationCollection(cardLocale);
	const translated = translationCollection
		? new Map((await getCollection(translationCollection)).map((entry) => [entry.id, entry.data]))
		: new Map<string, CenterSourceData>();

	const sources = (await getCollection("centers")).map((entry) => ({
		id: entry.id,
		ru: entry.data as CenterSourceData,
		shown: translated.get(entry.id) as CenterSourceData | undefined,
	}));

	return buildCatalogPayload(sources, cardLocale, false);
}
