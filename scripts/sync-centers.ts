/**
 * Карточки центров из API (api.tatarverse.cc) → mdx-файлы коллекций
 * `centers` и `centersEn`.
 *
 * Источник правды - API: карточки правят модераторы, а сайт перед сборкой
 * забирает выгрузку `GET /centers/export` (все карточки целиком, по языку
 * на запрос) и раскладывает её в прежний формат: frontmatter + разделы
 * «Контакты», «Ссылки», «О центре»… Поэтому каталог, фильтры, страницы
 * центров, поиск, статистика и печать строятся как раньше.
 *
 * Файлы лежат в git как снимок API: даты публикации берутся из истории,
 * а сборка без сети работает на последнем снимке. Руками их не правят -
 * следующая синхронизация перезапишет.
 *
 * Запуск: `bun scripts/sync-centers.ts` (входит в dev, build и check).
 * Нет сети или API отвечает ошибкой - остаются прежние файлы.
 */
import fs from "node:fs";
import path from "node:path";

const API = process.env.TATARVERSE_API ?? "https://api.tatarverse.cc";

const TARGETS = {
	ru: path.resolve("src/data/centers_formatted"),
	en: path.resolve("src/data/centers_i18n/en"),
} as const;

type Lang = keyof typeof TARGETS;

type Localized = Record<string, { text?: string | null } | null> | null | undefined;
type LocalizedList = Record<string, { items?: string[] | null } | null> | null | undefined;

interface ExportCard {
	id: string;
	name: Localized;
	summary: Localized;
	about: Localized;
	typeCode: string;
	categoryCode: string;
	source: string | null;
	pubDate: string | null;
	updatedAt: string | null;
	location: {
		country: string | null;
		region: Localized;
		district: Localized;
		city: Localized;
	} | null;
	address: string | null;
	links: { url: string; kind?: string | null }[];
	leader: string | null;
	phones: string[];
	emails: string[];
	features: LocalizedList;
	facts: { label: string; value: string }[];
	sources: { url: string; title: string | null }[];
}

/** Тип и народ в frontmatter - русские значения из схемы коллекции на обоих языках. */
const TYPES: Record<string, string> = { russia: "Регион РФ", abroad: "Зарубежный", online: "Онлайн" };
const CATEGORIES: Record<string, string> = {
	tatar: "Татарский",
	"tatar-bashkir": "Татаро-Башкирский",
	bashkir: "Башкирский",
	"crimean-tatar": "Крымотатарский",
};

const LABELS = {
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

const PLATFORM_LABELS: Record<string, string> = {
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

async function fetchExport(lang: Lang): Promise<ExportCard[]> {
	const response = await fetch(`${API}/centers/export?lang=${lang}`, { headers: { Accept: "application/json" } });
	if (!response.ok) throw new Error(`GET /centers/export?lang=${lang}: HTTP ${response.status}`);
	const body = (await response.json()) as { total?: number; data?: ExportCard[] };
	if (!Array.isArray(body.data) || body.data.length === 0) {
		throw new Error(`GET /centers/export?lang=${lang}: пустая выгрузка`);
	}
	if (typeof body.total === "number" && body.total !== body.data.length) {
		throw new Error(`GET /centers/export?lang=${lang}: ${body.data.length} из ${body.total} карточек`);
	}
	return body.data;
}

/**
 * Текст на языке файла. `strict` - только перевод: английская страница
 * без перевода «О центре» лучше без раздела, чем с русским текстом.
 */
function text(map: Localized, lang: Lang, strict = false): string | null {
	const own = map?.[lang]?.text?.trim();
	if (own || strict) return own || null;
	return Object.values(map ?? {}).find((entry) => entry?.text?.trim())?.text?.trim() ?? null;
}

function items(map: LocalizedList, lang: Lang): string[] {
	return (map?.[lang]?.items ?? []).map((item) => item.trim()).filter(Boolean);
}

/** MDX читает `{…}` как выражение, а `<` как JSX: в тексте из API их экранируем. */
const mdx = (value: string) => value.replace(/[{}<]/g, (char) => `\\${char}`);

/** Подпись ссылки: квадратные скобки сломали бы markdown-ссылку. */
const linkText = (value: string) => mdx(value).replace(/[[\]]/g, (char) => `\\${char}`);

const hostOf = (url: string) => {
	try {
		const parsed = new URL(url);
		return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname.replace(/\/+$/, "")}`;
	} catch {
		return url;
	}
};

const yaml = (value: string) => JSON.stringify(value);

function frontmatter(card: ExportCard, lang: Lang): string {
	const lines = [`title: ${yaml(text(card.name, lang) ?? card.id)}`];
	const type = TYPES[card.typeCode];
	const category = CATEGORIES[card.categoryCode];
	if (type) lines.push(`type: ${yaml(type)}`);
	if (category) lines.push(`category: ${yaml(category)}`);
	if (card.source) lines.push(`source: ${yaml(card.source)}`);
	const summary = text(card.summary, lang, lang !== "ru");
	if (summary) lines.push(`summary: ${yaml(summary)}`);
	if (card.pubDate) lines.push(`pubDate: ${yaml(card.pubDate)}`);
	if (card.updatedAt) lines.push(`updatedAt: ${yaml(card.updatedAt)}`);

	const location = card.location;
	const place = [
		["country", location?.country?.trim() || null],
		["region", text(location?.region, lang)],
		["district", text(location?.district, lang)],
		["city", text(location?.city, lang)],
	].filter((entry): entry is [string, string] => Boolean(entry[1]));
	if (place.length) {
		lines.push("location:", ...place.map(([key, value]) => `  ${key}: ${yaml(value)}`));
	}

	return `---\n${lines.join("\n")}\n---\n`;
}

function body(card: ExportCard, lang: Lang): string {
	const l = LABELS[lang];
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
		const label = (link: ExportCard["links"][number]) =>
			(link.kind && PLATFORM_LABELS[link.kind]) ||
			(link.kind === "maps" ? l.maps : link.kind === "website" ? l.website : hostOf(link.url));
		sections.push([l.links, list(card.links.map((link) => `[${linkText(label(link))}](${link.url})`))]);
	}

	const features = items(card.features, lang);
	if (features.length) sections.push([l.features, list(features.map(mdx))]);

	const about = text(card.about, lang, lang !== "ru");
	if (about) sections.push([l.about, mdx(about)]);

	if (card.facts.length) {
		sections.push([l.facts, card.facts.map((fact) => `> - ${mdx(fact.label)}: ${mdx(fact.value)}`).join("\n")]);
	}

	// Основной источник уже стоит в frontmatter (`source`), без подписи его не повторяем.
	const sources = card.sources.filter((item) => item.title || item.url !== card.source);
	if (sources.length) {
		sections.push([l.sources, list(sources.map((item) => `[${linkText(item.title ?? hostOf(item.url))}](${item.url})`))]);
	}

	return sections.map(([heading, content]) => `\n## ${heading}\n\n${content}\n`).join("");
}

/** Пишет только изменившиеся файлы и убирает карточки, которых в API больше нет. */
function writeCollection(lang: Lang, cards: ExportCard[]) {
	const dir = TARGETS[lang];
	fs.mkdirSync(dir, { recursive: true });
	const wanted = new Set<string>();
	let written = 0;

	for (const card of cards) {
		const file = `${card.id}.mdx`;
		wanted.add(file);
		const target = path.join(dir, file);
		const content = frontmatter(card, lang) + body(card, lang);
		if (fs.existsSync(target) && fs.readFileSync(target, "utf8") === content) continue;
		fs.writeFileSync(target, content);
		written += 1;
	}

	let removed = 0;
	for (const file of fs.readdirSync(dir)) {
		if (!file.endsWith(".mdx") || wanted.has(file)) continue;
		fs.rmSync(path.join(dir, file));
		removed += 1;
	}

	console.log(`[centers] ${lang}: ${cards.length} карточек, обновлено ${written}, удалено ${removed}`);
}

try {
	const [ru, en] = await Promise.all([fetchExport("ru"), fetchExport("en")]);
	writeCollection("ru", ru);
	writeCollection("en", en);
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	const hasSnapshot = fs.existsSync(TARGETS.ru) && fs.readdirSync(TARGETS.ru).some((file) => file.endsWith(".mdx"));
	if (!hasSnapshot) {
		console.error(`[centers] не удалось получить карточки из API: ${message}`);
		process.exit(1);
	}
	console.warn(`[centers] API недоступен (${message}) - сборка идёт на прежних файлах`);
}
