import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import solid from "@astrojs/solid-js";
import dualmark from "@dualmark/astro";
import tailwindcss from "@tailwindcss/vite";
import AstroPWA from "@vite-pwa/astro";
import icon from "astro-icon";
import metaTags from "astro-meta-tags";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, fontProviders } from "astro/config";
import { config } from "./src/config.ts";
import { centerRedirects } from "./src/data/centerRedirects.ts";
import aiTxt from "./src/lib/integrations/aiTxt.ts";
import { buildHomeMarkdown } from "./src/lib/integrations/homeMarkdown.ts";
import indexNow from "./src/lib/integrations/indexNow.ts";
import llmsTxt from "./src/lib/integrations/llmsTxt.ts";
import robotsTxt from "./src/lib/integrations/robotsTxt.ts";
import { includeAssets, manifest, workbox } from "./src/lib/site/pwaSettings.ts";

/**
 * Страницы центров рендерятся по запросу и сами в карту сайта не попадают: адреса берём из выгрузки
 * (снимок в src/data, его обновляет centers:sync), английские - из её сводки centers.meta.json.
 */
const centerUrl = (prefix, id) => new URL(`${prefix}/centers/${id}/`, config.site.url).href;
const centerPages = () => [
  ...readdirSync("./src/data/centers_formatted")
    .filter((file) => /^tbk-\d+\.mdx?$/.test(file))
    .map((file) => centerUrl("", file.replace(/\.mdx?$/, ""))),
  ...JSON.parse(readFileSync("./src/data/centers.meta.json", "utf8")).translated.map((id) => centerUrl("/en", id)),
];

/**
 * Значки, которые встречаются в коде (`mdi:…`, `tabler:…`): astro-icon кладёт в сборку и в воркер страницы
 * центра только их, а не наборы целиком (~5 МБ). Новый значок подхватится сам при следующей сборке.
 */
function usedIcons(dir = "./src", found = { mdi: new Set(), tabler: new Set() }) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (!/^centers_(formatted|i18n)$/.test(name)) usedIcons(path, found);
    } else if (/\.(astro|ts|tsx|js|mjs|md|mdx)$/.test(name)) {
      for (const [, set, icon] of readFileSync(path, "utf8").matchAll(/\b(mdi|tabler):([a-z0-9]+(?:-[a-z0-9]+)*)/g)) {
        found[set].add(icon);
      }
    }
  }
  return found;
}
const icons = usedIcons();

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
      subsets: ["latin", "cyrillic"],
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
    locales: ["ru", "en"],
    defaultLocale: "ru",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      customPages: centerPages(),
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, "");
        const excluded = new Set([
          "/saved",
          "/en/saved",
          "/nearby",
          "/en/nearby",
          "/centers/print",
          "/en/centers/print",
          "/submit/edit",
          "/en/submit/edit",
          "/submissions",
          "/en/submissions",
        ]);
        return !excluded.has(path);
      },
    }),
    mdx(),
    solid(),
    icon({ iconDir: "src/assets/icons", include: { mdi: [...icons.mdi], tabler: [...icons.tabler] } }),
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
          collections: ["centers"],
          maxUrls: 500,
        }),
      ]
      : []),
    AstroPWA({
      manifestFilename: "site.webmanifest",
      registerType: "autoUpdate",
      includeAssets,
      manifest,
      // С адаптером статика собирается в dist/client (рядом dist/server - воркер): service worker и список
      // файлов для него - оттуда. Сама интеграция так делает только для output: "server".
      outDir: "dist/client",
      workbox: { ...workbox, globDirectory: "dist/client" },
    }),
  ],
  prefetch: {
    defaultStrategy: "tap",
    prefetchAll: false,
  },
  vite: {
    plugins: [
      tailwindcss(),
      {
        // Серверные окружения в dev - рантайм Workers, а он не понимает CommonJS. Поэтому:
        // - @iconify/utils (его берёт Icon из astro-icon) - через предсборку, иначе он грузится как .cjs;
        // - нативный @resvg/resvg-js (OG-картинки, рисуются при сборке в Node) - мимо неё: его не переварить.
        name: "tatarverse:workers-dev-deps",
        configEnvironment(name) {
          if (name !== "client") {
            return { optimizeDeps: { include: ["@iconify/utils"], exclude: ["@resvg/resvg-js"] } };
          }
        },
      },
    ],
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
  // Сайт статичный, кроме страницы центра: она рендерится по запросу из API каталога (prerender = false
  // в pages/centers/[id].astro) на Cloudflare Workers. Статические страницы собираются в Node, как раньше.
  // В `astro dev` - wrangler.dev.jsonc (без run_worker_first): иначе запросы Vite уходили бы в воркер и 404.
  adapter: cloudflare({
    prerenderEnvironment: "node",
    imageService: "compile",
    configPath: process.argv.includes("dev") ? "./wrangler.dev.jsonc" : undefined,
  }),
  session: false,
  experimental: {
    // Пропускаем ререндер страниц, чей cacheKey и граф зависимостей не менялись.
    incrementalBuild: true,
  },
});
