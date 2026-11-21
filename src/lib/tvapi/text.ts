import type { LocalizedListMap, LocalizedMap } from "./client";

/**
 * Многоязычные поля API: `{ ru: { text } }`, списки - `{ ru: { items } }`.
 * Каталог отдаёт один язык (запасной - русский), модерация - все сразу.
 */
export function pickText(value: LocalizedMap | null | undefined, lang?: string): string {
	if (!value) return "";
	if (lang && value[lang]?.text) return value[lang].text ?? "";
	return Object.values(value).find((entry) => entry?.text)?.text ?? "";
}

/** Язык, на котором текст пришёл: каталог подставляет русский, если перевода нет. */
export function textLang(value: LocalizedMap | null | undefined): string | undefined {
	return value ? Object.keys(value).find((key) => value[key]?.text) : undefined;
}

export function pickItems(value: LocalizedListMap | null | undefined, lang?: string): string[] {
	if (!value) return [];
	if (lang && value[lang]?.items?.length) return value[lang].items ?? [];
	return Object.values(value).find((entry) => entry?.items?.length)?.items ?? [];
}

export function formatDate(value: string | null | undefined, locale: string, time = false): string {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "long",
		year: "numeric",
		...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
	}).format(date);
}
