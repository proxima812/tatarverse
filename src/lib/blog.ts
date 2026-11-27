import { getCollection } from "astro:content";
import { defaultLocale, type AppLocale } from "@/i18n";

export async function getBlogEntries(locale?: AppLocale) {
	const now = Date.now();
	return (await getCollection("blog", ({ data }) =>
		!data.draft && data.pubDate.getTime() <= now && (!locale || data.locale === locale),
	)).sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/** Путь к RSS блога. Не через localizePath: тот дописывает слеш, а лента - файл. */
export const blogRssPath = (locale: AppLocale) => `${locale === defaultLocale ? "" : `/${locale}`}/blog/rss.xml`;
