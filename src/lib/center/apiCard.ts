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

/** Поля карточки для frontmatter: у выгрузки (ExportCard) и у GET /centers/{code} они общие. */
export type CenterDataCard = Pick<ExportCard, "id" | "name" | "summary" | "typeCode" | "categoryCode" | "source" | "pubDate" | "updatedAt"> & {
	location: Pick<NonNullable<ExportCard["location"]>, "country" | "region" | "district" | "city"> | null;
};

/** Поля frontmatter карточки: пустые не заводим, как и в mdx. */
export function centerData(card: CenterDataCard, lang: string): CenterApiData {
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

// ── Текст страницы центра: «Контакты», «Ссылки», «О центре»… ─────────────────
//
// Одно правило на двоих: по нему `scripts/sync-centers.ts` пишет тело mdx, а страница центра,
// которая рендерится по запросу (`pages/centers/[id].astro`), строит те же разделы из карточки API.

export const CENTER_LABELS = {
	ru: {
		contacts: "Контакты",
		address: "Адрес/Локация",
		links: "Ссылки",
		features: "Особенности",
		about: "О центре",
		facts: "Прочее",
		sources: "Источники",
		leader: "Руководитель",
		phone: "Телефон",
		email: "Email",
		website: "Сайт",
		maps: "Карты",
	},
	en: {
		contacts: "Contacts",
		address: "Address / Location",
		links: "Links",
		features: "Highlights",
		about: "About",
		facts: "Other",
		sources: "Sources",
		leader: "Director",
		phone: "Phone",
		email: "Email",
		website: "Website",
		maps: "Maps",
	},
} as const;

export const PLATFORM_LABELS: Record<string, string> = {
	instagram: "Instagram",
	telegram: "Telegram",
	vk: "VK",
	youtube: "YouTube",
	facebook: "Facebook",
	ok: "OK",
	tiktok: "TikTok",
	twitter: "X",
	whatsapp: "WhatsApp",
};

export type CenterLang = keyof typeof CENTER_LABELS;

export const centerLang = (value: string | undefined): CenterLang => (value === "en" ? "en" : "ru");

/** Поля карточки, из которых складывается текст: у выгрузки (`ExportCard`) и у `GET /centers/{code}` они общие. */
export interface CenterBodyCard {
	about: ApiLocalized;
	source: string | null;
	address: string | null;
	links: { url: string; kind?: string | null }[];
	leader: string | null;
	phones: string[];
	emails: string[];
	features: ApiLocalizedList;
	facts: { label: string; value: string }[];
	sources: { url: string; title?: string | null }[];
}

/** MDX читает `{…}` как выражение, а `<` как JSX: в тексте из API их экранируем. */
const mdx = (value: string) => value.replace(/[{}<]/g, (char) => `\\${char}`);

/** Подпись ссылки: квадратные скобки сломали бы markdown-ссылку. */
const linkText = (value: string) => mdx(value).replace(/[[\]]/g, (char) => `\\${char}`);

export const hostOf = (url: string) => {
	try {
		const parsed = new URL(url);
		return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname.replace(/\/+$/, "")}`;
	} catch {
		return url;
	}
};

/** «Источники» без основного источника карточки (он стоит в сведениях), если у него нет своей подписи. */
export const centerSources = (card: CenterBodyCard) => card.sources.filter((item) => item.title || item.url !== card.source);

export function centerBody(card: CenterBodyCard, lang: CenterLang): string {
	const l = CENTER_LABELS[lang];
	const sections: [string, string][] = [];
	const list = (rows: string[]) => rows.map((row) => `- ${row}`).join("\n");

	const contacts = [
		card.leader?.trim() ? `${l.leader}: ${mdx(card.leader.trim())}` : null,
		...card.phones.map((phone) => `${l.phone}: [${linkText(phone)}](tel:${phone.replace(/[^\d+]/g, "")})`),
		...card.emails.map((email) => `${l.email}: [${linkText(email)}](mailto:${email})`),
	].filter((row): row is string => Boolean(row));
	if (contacts.length) sections.push([l.contacts, list(contacts)]);

	if (card.address?.trim()) sections.push([l.address, list([mdx(card.address.trim())])]);

	if (card.links.length) {
		const label = (link: { url: string; kind?: string | null }) =>
			(link.kind && PLATFORM_LABELS[link.kind]) ||
			(link.kind === "maps" ? l.maps : link.kind === "website" ? l.website : hostOf(link.url));
		sections.push([l.links, list(card.links.map((link) => `[${linkText(label(link))}](${link.url})`))]);
	}

	const features = apiItems(card.features, lang);
	if (features.length) sections.push([l.features, list(features.map(mdx))]);

	const about = apiText(card.about, lang, lang !== "ru");
	if (about) sections.push([l.about, mdx(about)]);

	if (card.facts.length) {
		sections.push([l.facts, card.facts.map((fact) => `> - ${mdx(fact.label)}: ${mdx(fact.value)}`).join("\n")]);
	}

	// Основной источник уже стоит в frontmatter (`source`), без подписи его не повторяем.
	const sources = centerSources(card);
	if (sources.length) {
		sections.push([l.sources, list(sources.map((item) => `[${linkText(item.title ?? hostOf(item.url))}](${item.url})`))]);
	}

	return sections.map(([heading, content]) => `\n## ${heading}\n\n${content}\n`).join("");
}
