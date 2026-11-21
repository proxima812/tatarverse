import type { CenterFields, LocalizedListMap, LocalizedMap } from "@/lib/tvapi/client";

/**
 * Черновик карточки для форм: плоские строки и списки, удобные для полей
 * ввода. Многоязычные поля - по языкам. `toFields` собирает обратно
 * `CenterFields` по правилам API: присланное как получили, изменённое -
 * под ключом языка, остальные языки не трогаем.
 */
export const TEXT_FIELDS = ["name", "summary", "about", "region", "district", "city"] as const;
export type TextField = (typeof TEXT_FIELDS)[number];

export interface CenterDraft {
	text: Record<TextField, Record<string, string>>;
	features: Record<string, string[]>;
	category: string;
	online: boolean;
	country: string;
	federalDistrict: string;
	address: string;
	latitude: string;
	longitude: string;
	links: string[];
	phones: string[];
	emails: string[];
	leader: string;
	facts: { label: string; value: string }[];
	sources: { url: string; title: string }[];
}

export interface DraftSource {
	fields: CenterFields | null;
	/** Языки, которые форма показывает. */
	langs: string[];
	/**
	 * Публичная форма: нет текста на языке формы - показываем запасной
	 * (каталог присылает русский). Модерация видит каждый язык как есть.
	 */
	fallback: boolean;
}

function shownText(map: LocalizedMap | null | undefined, lang: string, fallback: boolean): string {
	const own = map?.[lang]?.text;
	if (own || !fallback) return own ?? "";
	return Object.values(map ?? {}).find((entry) => entry?.text)?.text ?? "";
}

function shownItems(map: LocalizedListMap | null | undefined, lang: string, fallback: boolean): string[] {
	const own = map?.[lang]?.items;
	if (own?.length || !fallback) return [...(own ?? [])];
	return [...(Object.values(map ?? {}).find((entry) => entry?.items?.length)?.items ?? [])];
}

export function createDraft({ fields, langs, fallback }: DraftSource): CenterDraft {
	const f = fields;
	const text = {} as CenterDraft["text"];
	for (const key of TEXT_FIELDS) {
		text[key] = Object.fromEntries(langs.map((lang) => [lang, shownText(f?.[key] as LocalizedMap, lang, fallback)]));
	}
	const latitude = f?.latitude;
	const longitude = f?.longitude;
	return {
		text,
		features: Object.fromEntries(langs.map((lang) => [lang, shownItems(f?.features as LocalizedListMap, lang, fallback)])),
		category: f?.category ?? "",
		online: Boolean(f?.online),
		country: f?.country ?? "",
		federalDistrict: f?.federalDistrict ?? "",
		address: f?.address ?? "",
		latitude: latitude === null || latitude === undefined ? "" : String(latitude),
		longitude: longitude === null || longitude === undefined ? "" : String(longitude),
		links: (f?.links ?? []).map((link) => link.url),
		phones: [...(f?.phones ?? [])],
		emails: [...(f?.emails ?? [])],
		leader: f?.leader ?? "",
		facts: (f?.facts ?? []).map((fact) => ({ ...fact })),
		sources: (f?.sources ?? []).map((source) => ({ url: source.url, title: source.title ?? "" })),
	};
}

const clean = (values: string[]) => values.map((value) => value.trim()).filter(Boolean);
const orNull = (value: string) => value.trim() || null;

export function toFields(draft: CenterDraft, source: DraftSource): CenterFields {
	const original = source.fields;
	const fields: CenterFields = {
		category: orNull(draft.category),
		online: draft.online,
		country: draft.online && !draft.country ? null : orNull(draft.country),
		federalDistrict: draft.country === "RU" ? orNull(draft.federalDistrict) : null,
		address: orNull(draft.address),
		latitude: draft.latitude.trim() ? Number(draft.latitude.replace(",", ".")) : null,
		longitude: draft.longitude.trim() ? Number(draft.longitude.replace(",", ".")) : null,
		links: clean(draft.links).map((url) => {
			// Вид ссылки сервер ставит сам, но прежний не теряем.
			const kind = original?.links?.find((link) => link.url === url)?.kind;
			return kind ? { url, kind } : { url };
		}),
		phones: clean(draft.phones),
		emails: clean(draft.emails),
		leader: orNull(draft.leader),
		facts: draft.facts
			.map((fact) => ({ label: fact.label.trim(), value: fact.value.trim() }))
			.filter((fact) => fact.label || fact.value),
		sources: draft.sources
			.map((item) => ({ url: item.url.trim(), title: orNull(item.title) }))
			.filter((item) => item.url),
	};

	for (const key of TEXT_FIELDS) {
		const before = (original?.[key] as LocalizedMap | null | undefined) ?? {};
		const map: LocalizedMap = { ...before };
		for (const lang of source.langs) {
			const value = draft.text[key][lang] ?? "";
			if (value.trim() !== shownText(before, lang, source.fallback).trim()) map[lang] = { text: value.trim() };
		}
		fields[key] = Object.keys(map).length ? map : null;
	}

	const beforeFeatures = (original?.features as LocalizedListMap | null | undefined) ?? {};
	const features: LocalizedListMap = { ...beforeFeatures };
	for (const lang of source.langs) {
		const items = clean(draft.features[lang] ?? []);
		if (items.join("\n") !== shownItems(beforeFeatures, lang, source.fallback).join("\n")) features[lang] = { items };
	}
	fields.features = Object.keys(features).length ? features : null;

	return fields;
}

/** Ошибка поля из `fields` ответа 400: `name.en`, `links[2]`, `name`… */
export function fieldError(errors: Record<string, string>, ...keys: string[]): string | undefined {
	for (const key of keys) {
		if (errors[key]) return errors[key];
	}
	return undefined;
}

/** Все ошибки списка: `links`, `links[0]`, `links[3]`. */
export function listErrors(errors: Record<string, string>, key: string): string | undefined {
	const found = Object.entries(errors)
		.filter(([name]) => name === key || name.startsWith(`${key}[`) || name.startsWith(`${key}.`))
		.map(([, message]) => message);
	return found.length ? [...new Set(found)].join(" ") : undefined;
}
