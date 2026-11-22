/**
 * Карточка из выгрузки API (`GET /centers/export`) → поля центра в том виде,
 * в каком их знает сайт: frontmatter коллекции `centers`.
 *
 * Одно правило на двоих: по нему `scripts/sync-centers.ts` пишет mdx на
 * сборке, а каталог в браузере (`lib/client/liveCatalog.ts`) подменяет
 * устаревшие карточки свежими из API. Разойтись им нельзя - иначе живая
 * карточка отличалась бы от собранной и фильтры видели бы разные значения.
 *
 * Модуль попадает в клиентский бандл: никаких Node-зависимостей.
 */

export type ApiLocalized = Record<string, { text?: string | null } | null> | null | undefined;
export type ApiLocalizedList = Record<string, { items?: string[] | null } | null> | null | undefined;

export interface ExportCard {
	id: string;
	name: ApiLocalized;
	summary: ApiLocalized;
	about: ApiLocalized;
	typeCode: string;
	categoryCode: string;
	source: string | null;
	pubDate: string | null;
	updatedAt: string | null;
	location: {
		country: string | null;
		region: ApiLocalized;
		district: ApiLocalized;
		city: ApiLocalized;
	} | null;
	address: string | null;
	links: { url: string; kind?: string | null }[];
	leader: string | null;
	phones: string[];
	emails: string[];
	features: ApiLocalizedList;
	facts: { label: string; value: string }[];
	sources: { url: string; title: string | null }[];
}

export interface ExportResponse {
	total?: number;
	updatedAt?: string | null;
	data?: ExportCard[];
}

/** Тип и народ - русские значения из схемы коллекции на обоих языках. */
export const CENTER_TYPES: Record<string, string> = {
	russia: "Регион РФ",
	abroad: "Зарубежный",
	online: "Онлайн",
};
export const CENTER_CATEGORIES: Record<string, string> = {
	tatar: "Татарский",
	"tatar-bashkir": "Татаро-Башкирский",
	bashkir: "Башкирский",
	"crimean-tatar": "Крымотатарский",
};

/**
 * Текст на нужном языке. `strict` - только перевод: английская страница
 * без перевода «О центре» лучше без раздела, чем с русским текстом.
 */
export function apiText(map: ApiLocalized, lang: string, strict = false): string | null {
	const own = map?.[lang]?.text?.trim();
	if (own || strict) return own || null;
	return Object.values(map ?? {}).find((entry) => entry?.text?.trim())?.text?.trim() ?? null;
}

export function apiItems(map: ApiLocalizedList, lang: string): string[] {
	return (map?.[lang]?.items ?? []).map((item) => item.trim()).filter(Boolean);
}

export interface CenterApiData {
	title: string;
	type?: string;
	category?: string;
	source?: string;
	summary?: string;
	pubDate?: string;
	updatedAt?: string;
	location: { country?: string; region?: string; district?: string; city?: string };
}

/** Поля frontmatter карточки: пустые не заводим, как и в mdx. */
export function centerData(card: ExportCard, lang: string): CenterApiData {
	const location = card.location;
	const place = {
		country: location?.country?.trim() || undefined,
		region: apiText(location?.region, lang) ?? undefined,
		district: apiText(location?.district, lang) ?? undefined,
		city: apiText(location?.city, lang) ?? undefined,
	};

	return {
		title: apiText(card.name, lang) ?? card.id,
		type: CENTER_TYPES[card.typeCode],
		category: CENTER_CATEGORIES[card.categoryCode],
		source: card.source || undefined,
		summary: apiText(card.summary, lang, lang !== "ru") ?? undefined,
		pubDate: card.pubDate || undefined,
		updatedAt: card.updatedAt || undefined,
		location: place,
	};
}

/**
 * Версия данных каталога: сколько карточек и когда правили последнюю.
 * Совпала с `/stats` API - собранные карточки свежие, выгрузку не качаем.
 */
export interface CatalogVersion {
	count: number;
	updatedAt: string | null;
}

export function catalogVersion(updatedAts: (string | undefined)[]): CatalogVersion {
	let latest: string | null = null;
	for (const value of updatedAts) {
		if (value && (!latest || Date.parse(value) > Date.parse(latest))) latest = value;
	}
	return { count: updatedAts.length, updatedAt: latest };
}

export const sameVersion = (left: CatalogVersion, right: CatalogVersion) =>
	left.count === right.count &&
	(left.updatedAt ? Date.parse(left.updatedAt) : 0) === (right.updatedAt ? Date.parse(right.updatedAt) : 0);
