import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import solid from "@astrojs/solid-js";
import dualmark from "@dualmark/astro";
import tailwindcss from "@tailwindcss/vite";
import AstroPWA from "@vite-pwa/astro";
import icon from "astro-icon";
import metaTags from "astro-meta-tags";
import { defineConfig, fontProviders } from "astro/config";
import { config } from "./src/config.ts";
import { centerRedirects } from "./src/data/centerRedirects.ts";
import aiTxt from "./src/lib/integrations/aiTxt.ts";
import { buildHomeMarkdown } from "./src/lib/integrations/homeMarkdown.ts";
import indexNow from "./src/lib/integrations/indexNow.ts";
import llmsTxt from "./src/lib/integrations/llmsTxt.ts";
import robotsTxt from "./src/lib/integrations/robotsTxt.ts";
import { includeAssets, manifest, workbox } from "./src/lib/site/pwaSettings.ts";

export default defineConfig({
  site: config.site.url,
  // Слитые дубли центров: старый tbk-N ведёт на оставшуюся карточку.
  redirects: centerRedirects(),
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Onest",
      cssVariable: "--font-onest",
      weights: ["400 700"],
      styles: ["normal"],
      subsets: ["latin", "cyrillic", "cyrillic-ext"],
      display: "swap",
    },
    {
      provider: fontProviders.local(),
      name: "Inter",
      cssVariable: "--font-inter",
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/inter.woff2"],
            weight: "100 900",
            style: "normal",
            display: "optional",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Twemoji Country Flags",
      cssVariable: "--font-country-flags",
      fallbacks: [],
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/twemoji-country-flags.woff2"],
            weight: 400,
            style: "normal",
            display: "swap",
            unicodeRange: ["U+1F1E6-1F1FF", "U+1F3F4", "U+E0062-E007F"],
          },
        ],
      },
    },
  ],
  i18n: {
    locales: ["ru", "en", "tt"],
    defaultLocale: "ru",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, "");
        const excluded = new Set(
          ["/saved", "/nearby", "/centers/print", "/submit/edit", "/submissions"].flatMap(
            (route) => [route, `/en${route}`, `/tt${route}`],
          ),
        );
        return !excluded.has(path);
      },
    }),
    mdx(),
    solid(),
    icon({ uis: ["*"], iconDir: "src/assets/icons" }),
    metaTags(),
    robotsTxt(),
    ...(config.features.llms ? [llmsTxt()] : []),
    ...(config.features.ai ? [aiTxt()] : []),
    dualmark({
      siteUrl: config.site.url.replace(/\/$/, ""),
      collections: {
        centers: {
          converter: "docs",
          route: "centers",
          slugStrategy: "single",
          listingMetadata: {
            title: "Центры tatarverse",
            description:
              "Каталог татарских, башкирских и крымскотатарских культурных центров и сообществ.",
          },
        },
      },
      staticPages: [
        {
          pattern: "/",
          render: new Function(
            `return ${JSON.stringify(buildHomeMarkdown(config.site.url))};`,
          ),
        },
      ],
      llmsTxt: {
        enabled: false,
      },
      middleware: {
        injectLinkHeader: false,
      },
    }),
    ...(config.features.indexNow
      ? [
        indexNow({
          key: config.indexNow.key,
          siteUrl: config.site.url,
          collections: ["centers", "blog", "en/centers", "en/blog", "tt/centers", "tt/blog"],
          // Предел одного запроса IndexNow; меньше нельзя - кеш запоминает все URL, и неотправленные потерялись бы.
          maxUrls: 10000,
          // Отправляем только из cf:deploy: локальная сборка и cf:preview не должны дёргать поисковики.
          enabled: process.env.INDEXNOW === "1",
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
  prefetch: {
    defaultStrategy: "tap",
    prefetchAll: false,
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: ["**/.impeccable/**"],
      },
    },
    ssr: {
      external: ["@dualmark/astro", "@dualmark/core", "@dualmark/converters"],
    },
  },
  devToolbar: {
    enabled: false,
  },
  output: "static",
  experimental: {
    // Пропускаем ререндер страниц, чей cacheKey и граф зависимостей не менялись.
    incrementalBuild: true,
  },
});
