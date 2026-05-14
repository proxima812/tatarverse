import deDict from "@/i18n/locales/de";
import enDict from "@/i18n/locales/en";
import esDict from "@/i18n/locales/es";
import kkDict from "@/i18n/locales/kk";
import kyDict from "@/i18n/locales/ky";
import qtDict from "@/i18n/locales/qt";
import ruDict from "@/i18n/locales/ru";
import ttDict from "@/i18n/locales/tt";
import ukDict from "@/i18n/locales/uk";
import uzDict from "@/i18n/locales/uz";
import { getRelativeLocaleUrl } from "astro:i18n";
import type { Dictionary } from "@/i18n/ui";

export const allLocales = ["ru", "en", "tt", "qt", "uk", "de", "es", "ky", "uz", "kk"] as const;
export const locales = ["ru", "en", "tt", "qt"] as const;
export type AppLocale = (typeof allLocales)[number];
export type ActiveLocale = (typeof locales)[number];

export const defaultLocale: ActiveLocale = "ru";

export const localeLabels: Record<AppLocale, { label: string; short: Uppercase<AppLocale> }> = {
	ru: { label: "Русский", short: "RU" },
	en: { label: "English", short: "EN" },
	tt: { label: "Татарча", short: "TT" },
	qt: { label: "Qırımtatarca", short: "QT" },
	uk: { label: "Українська", short: "UK" },
	de: { label: "Deutsch", short: "DE" },
	es: { label: "Español", short: "ES" },
	ky: { label: "Кыргызча", short: "KY" },
	uz: { label: "O‘zbekcha", short: "UZ" },
	kk: { label: "Қазақша", short: "KK" },
};

const dictionaries: Record<AppLocale, Dictionary> = {
	ru: ruDict,
	en: enDict,
	tt: ttDict,
	qt: qtDict,
	uk: ukDict,
	de: deDict,
	es: esDict,
	ky: kyDict,
	uz: uzDict,
	kk: kkDict,
};

const ogLocales: Record<AppLocale, string> = {
	ru: "ru_RU",
	en: "en_US",
	tt: "tt_RU",
	qt: "crh_UA",
	uk: "uk_UA",
	de: "de_DE",
	es: "es_ES",
	ky: "ky_KG",
	uz: "uz_UZ",
	kk: "kk_KZ",
};

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

	const [pathname, hash = ""] = href.split("#");
	const relativePath = getLocalePathname(pathname);
	const localized = getRelativeLocaleUrl(locale, relativePath);

	return hash ? `${localized}#${hash}` : localized;
}

export function getSwitcherHref(locale: AppLocale, url: URL): string {
	const currentPath = getLocalePathname(url.pathname);
	const localized = getRelativeLocaleUrl(locale, currentPath);
	return `${localized}${url.search}${url.hash}`;
}

export function getOgLocale(locale: AppLocale): string {
	return ogLocales[locale];
}

export function useTranslations(locale: AppLocale) {
	const dict = dictionaries[locale] ?? dictionaries[defaultLocale];
	const fallback = dictionaries[defaultLocale];

	return (key: string, values?: Record<string, string | number>, defaultValue?: string) => {
		const template = dict[key] ?? fallback[key] ?? defaultValue ?? key;

		if (!values) return template;

		return template.replace(/\{(\w+)\}/g, (_, token: string) => String(values[token] ?? ""));
	};
}
