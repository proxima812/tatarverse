import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import AstroPWA from "@vite-pwa/astro";
import icon from "astro-icon";
import metaTags from "astro-meta-tags";
import { defineConfig } from "astro/config";
import rehypePrism from "rehype-prism-plus";
import remarkGemoji from "remark-gemoji";
import remarkGfm from "remark-gfm";
import { config } from "./main.config.ts";
import aiTxt from "./src/integrations/aiTxt.ts";
import indexNow from "./src/integrations/indexNow.ts";
import llmsTxt from "./src/integrations/llmsTxt.ts";
import robotsTxt from "./src/integrations/robotsTxt.ts";
import { includeAssets, manifest, workbox } from "./src/utils/pwaSettings.ts";

const remarkPlugins = [remarkGfm, remarkGemoji];
const rehypePlugins = [rehypePrism];

export default defineConfig({
	site: config.site.url,
	i18n: {
		locales: ["ru", "en", "tt", "qt"],
		defaultLocale: "ru",
		routing: {
			prefixDefaultLocale: false,
		},
	},
	integrations: [
		sitemap(),
		mdx(),
		icon({ uis: ["*"] }),
		metaTags(),
		robotsTxt(),
		...(config.features.llms ? [llmsTxt()] : []),
		...(config.features.ai ? [aiTxt()] : []),
		...(config.features.indexNow
			? [
					indexNow({
						key: config.indexNow.key,
						siteUrl: config.site.url,
					}),
				]
			: []),
		AstroPWA({
			manifestFilename: "site.webmanifest",
			registerType: "autoUpdate",
			includeAssets,
			manifest,
			workbox,
		}),
	],
	markdown: {
		syntaxHighlight: false,
		remarkPlugins,
		rehypePlugins,
	},
	prefetch: {
		defaultStrategy: "viewport",
		prefetchAll: true,
	},
	vite: {
		plugins: [tailwindcss()],
	},
	devToolbar: {
		enabled: true,
	},
	output: "static",
});
