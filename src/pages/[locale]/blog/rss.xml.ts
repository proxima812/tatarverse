import type { APIRoute } from "astro";
import type { AppLocale } from "@/i18n";
import { secondaryLocalePaths } from "@/i18n/routes";
import { blogRss } from "@/lib/blogRss";

export const getStaticPaths = secondaryLocalePaths;

export const GET: APIRoute = ({ params, site }) => blogRss(params.locale as AppLocale, site);
