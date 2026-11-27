import { getCollection } from "astro:content";
import { defaultLocale, type AppLocale } from "@/i18n";

export async function getBlogEntries(locale?: AppLocale) {
	const now = Date.now();
	return (await getCollection("blog", ({ data }) =>
		!data.draft && data.pubDate.getTime() <= now && (!locale || data.locale === locale),
	)).sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

const blogPrefix = (locale: AppLocale) => `${locale === defaultLocale ? "" : `/${locale}`}/blog`;

/** Путь к RSS блога. Не через localizePath: тот дописывает слеш, а лента - файл. */
export const blogRssPath = (locale: AppLocale) => `${blogPrefix(locale)}/rss.xml`;

/** Markdown-двойник материала для ИИ-ассистентов (AEO), как у карточек центров. */
export const blogMarkdownPath = (locale: AppLocale, id: string) => `${blogPrefix(locale)}/${id}.md`;
