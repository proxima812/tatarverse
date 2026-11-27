import type { APIRoute } from "astro";
import { getBlogEntries } from "@/lib/blog";
import { blogMarkdown } from "@/lib/blogMarkdown";

export async function getStaticPaths() {
	return (await getBlogEntries("ru")).map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props, site }) => blogMarkdown(props.entry, site);
