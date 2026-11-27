import type { CollectionEntry } from "astro:content";
import { config } from "@/config";
import { localizePath } from "@/i18n";

/** Тело статьи как есть плюс шапка: заголовок, лид, канонический адрес и даты. */
export function blogMarkdown({ id, body, data }: CollectionEntry<"blog">, site = new URL(config.site.url)) {
	const day = (date: Date) => date.toISOString().slice(0, 10);
	const meta = [
		`URL: ${new URL(localizePath(data.locale, `/blog/${id}/`), site).href}`,
		`Language: ${data.locale}`,
		`Published: ${day(data.pubDate)}`,
		...(data.updatedDate ? [`Updated: ${day(data.updatedDate)}`] : []),
		`Author: ${data.author}`,
	];
	const text = [`# ${data.title}`, "", `> ${data.description}`, "", ...meta, "", (body ?? "").trim(), ""].join("\n");
	return new Response(text, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
