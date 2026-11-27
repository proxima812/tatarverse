import rss from "@astrojs/rss";
import { config } from "@/config";
import { localizePath, useTranslations, type AppLocale } from "@/i18n";
import { getBlogEntries } from "@/lib/blog";

/** RSS-лента блога одной локали: /blog/rss.xml, /en/blog/rss.xml, /tt/blog/rss.xml. */
export async function blogRss(locale: AppLocale, site = new URL(config.site.url)) {
	const t = useTranslations(locale);
	const entries = await getBlogEntries(locale);
	return rss({
		title: `tatarverse | ${t("nav.blog")}`,
		description: t("blog.description"),
		// Ссылка канала - на сам блог, ссылки материалов абсолютные от корня.
		site: new URL(localizePath(locale, "/blog/"), site),
		items: entries.map(({ id, data }) => ({
			title: data.title,
			description: data.description,
			pubDate: data.pubDate,
			link: localizePath(locale, `/blog/${id}/`),
			categories: [t(`blog.${data.category}`)],
		})),
		customData: `<language>${locale}</language>`,
	});
}
