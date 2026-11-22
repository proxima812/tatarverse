import enDict from "@/i18n/locales/en";
import ruDict from "@/i18n/locales/ru";
import { getRelativeLocaleUrl } from "astro:i18n";
import type { Dictionary } from "@/i18n/ui";
import centersMeta from "@/data/centers.meta.json";

export const allLocales = ["ru", "en"] as const;
export const locales = ["ru", "en"] as const;
export type AppLocale = (typeof allLocales)[number];
export type ActiveLocale = (typeof locales)[number];

export const defaultLocale: ActiveLocale = "ru";

export const localeLabels: Record<AppLocale, { label: string; short: Uppercase<AppLocale> }> = {
	ru: { label: "Русский", short: "RU" },
	en: { label: "English", short: "EN" },
};

const dictionaries: Record<AppLocale, Dictionary> = {
	ru: ruDict,
	en: enDict,
};

const ogLocales: Record<AppLocale, string> = {
	ru: "ru_RU",
	en: "en_US",
};

/**
 * Центры с английской версией - из сводки выгрузки (`src/data/centers.meta.json`, scripts/sync-centers.ts).
 * Не glob по .mdx: модуль есть в воркере страницы центра, и glob утянул бы туда все карточки.
 */
const translatedCenterIds = new Set<string>(centersMeta.translated);

export function hasLocalizedRoute(locale: AppLocale, relativePath: string): boolean {
	if (locale === defaultLocale) return true;

	const centerId = relativePath.match(/^centers\/([^/.]+)$/)?.[1];
	if (centerId && !translatedCenterIds.has(centerId)) return false;

	return true;
}

export function isAppLocale(value: string | null | undefined): value is AppLocale {
	return Boolean(value && locales.includes(value as AppLocale));
}

export function getLocaleFromUrl(url: URL): AppLocale {
	const segment = url.pathname.split("/").filter(Boolean)[0];
	return isAppLocale(segment) ? segment : defaultLocale;
}

export function getLocalePathname(pathname: string): string {
	const segments = pathname.split("/").filter(Boolean);
	if (segments.length > 0 && isAppLocale(segments[0])) {
		return segments.slice(1).join("/");
	}

	return segments.join("/");
}

export function localizePath(locale: AppLocale, href: string): string {
	if (!href || href.startsWith("#")) return href;
	if (/^(?:[a-z]+:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:")) {
		return href;
	}

	if (!href.startsWith("/")) return href;

	// Query и hash отрезаем до локализации: иначе getRelativeLocaleUrl
	// допишет завершающий слеш после `?code=tbk-1`.
	const [beforeHash, hash = ""] = href.split("#");
	const [pathname, query = ""] = beforeHash.split("?");
	const suffix = `${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
	const relativePath = getLocalePathname(pathname);
	if (!hasLocalizedRoute(locale, relativePath)) {
		return `${relativePath ? `/${relativePath}/` : "/"}${suffix}`;
	}

	return `${getRelativeLocaleUrl(locale, relativePath)}${suffix}`;
}

function nearestLocalizedHub(locale: AppLocale, relativePath: string): string {
	const segments = relativePath.split("/").slice(0, -1);
	while (segments.length > 0) {
		const candidate = segments.join("/");
		if (hasLocalizedRoute(locale, candidate)) return candidate;
		segments.pop();
	}

	return "";
}

export function getSwitcherHref(locale: AppLocale, url: URL): string {
	const currentPath = getLocalePathname(url.pathname);
	// Publications have independent IDs in each language; switch to the blog hub.
	if (currentPath.startsWith("blog/")) return getRelativeLocaleUrl(locale, "blog");
	if (currentPath === "404") {
		return getRelativeLocaleUrl(locale, "");
	}

	if (!hasLocalizedRoute(locale, currentPath)) {
		return getRelativeLocaleUrl(locale, nearestLocalizedHub(locale, currentPath));
	}

	const localized = getRelativeLocaleUrl(locale, currentPath);
	return `${localized}${url.search}${url.hash}`;
}

export function getOgLocale(locale: AppLocale): string {
	return ogLocales[locale];
}

/**
 * Тип функции перевода: нужен модулям в `src/lib`, которые собирают данные
 * страницы и получают `t` параметром, а не зовут `useTranslations` сами.
 */
export type Translate = ReturnType<typeof useTranslations>;

export function useTranslations(locale: AppLocale) {
	const dict = dictionaries[locale] ?? dictionaries[defaultLocale];
	const fallback = dictionaries[defaultLocale];

	return (key: string, values?: Record<string, string | number>, defaultValue?: string) => {
		const template = dict[key] ?? fallback[key] ?? defaultValue ?? key;

		if (!values) return template;

		return template.replace(/\{(\w+)\}/g, (_, token: string) => String(values[token] ?? ""));
	};
}
