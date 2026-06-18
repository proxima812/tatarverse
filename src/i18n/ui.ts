export const allLanguages = ["ru", "en"] as const;
export const languages = ["ru", "en"] as const;

export type Language = (typeof allLanguages)[number];
export type ActiveLanguage = (typeof languages)[number];

export type Dictionary = Record<string, string>;

export function isLanguage(value: string | null): value is Language {
	return Boolean(value && languages.includes(value as Language));
}
