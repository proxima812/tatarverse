import type { APIRoute } from "astro";
import { blogRss } from "@/lib/blogRss";

export const GET: APIRoute = ({ site }) => blogRss("ru", site);
