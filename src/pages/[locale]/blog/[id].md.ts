import type { APIRoute } from "astro";
import { secondaryLocales } from "@/i18n/routes";
import { getBlogEntries } from "@/lib/blog";
import { blogMarkdown } from "@/lib/blogMarkdown";

export async function getStaticPaths() {
	return (await getBlogEntries())
		.filter((entry) => secondaryLocales().some((locale) => locale === entry.data.locale))
		.map((entry) => ({ params: { locale: entry.data.locale, id: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props, site }) => blogMarkdown(props.entry, site);
