export const languages = ["ru", "en", "tt", "qt", "uk", "de", "es", "ky", "uz", "kk"] as const;

export type Language = (typeof languages)[number];

export type Dictionary = Record<string, string>;

export function isLanguage(value: string | null): value is Language {
	return Boolean(value && languages.includes(value as Language));
}
