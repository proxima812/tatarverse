import type { Lang } from "./messages";

/** Адреса страниц островов: русские без префикса, как во всём сайте. */
export function pagePath(lang: Lang, path: string): string {
	return lang === "ru" ? path : `/${lang}${path}`;
}

export const paths = {
	catalog: (lang: Lang) => pagePath(lang, "/centers/"),
	center: (lang: Lang, code: string) => pagePath(lang, `/centers/${encodeURIComponent(code)}/`),
	add: (lang: Lang) => pagePath(lang, "/submit/"),
	edit: (lang: Lang, code: string) => pagePath(lang, `/submit/edit/?code=${encodeURIComponent(code)}`),
	fix: (lang: Lang, id: number) => pagePath(lang, `/submit/edit/?submission=${id}`),
	my: (lang: Lang) => pagePath(lang, "/submissions/"),
	policy: (lang: Lang) => pagePath(lang, "/policy/"),
};
