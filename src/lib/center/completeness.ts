import { getCenterLinks } from "@/lib/center/links";
import type { CollectionEntry } from "astro:content";

/**
 * Чего не хватает карточке, чтобы посетитель мог ей пользоваться:
 * - `contacts` — ни сайта, ни соцсети, ни телефона, почты или адреса;
 * - `about`    — нет описания того, чем центр занимается;
 * - `city`     — не указан ни город, ни регион (у онлайн-проектов не требуется);
 * - `sources`  — не на что сослаться, откуда сведения.
 */
export type CenterGap = "contacts" | "about" | "city" | "sources";

export interface CenterCompleteness {
	complete: boolean;
	gaps: CenterGap[];
}

/** Короче этого «О центре» — пересказ названия, а не описание. */
const MIN_ABOUT_LENGTH = 200;

/**
 * Шаблоны пакетного импорта из соцсетей: текст есть, но фактов о центре в нём
 * нет. Найдены аудитом карточек (TypeSafe Jev, октябрь 2026).
 */
const TEMPLATE_ABOUT = /публичная страница сообщества|онлайн-проект\. По описанию профиля|Ссылка на сообщество передана/i;

const MARKDOWN_LINK = /\[([^\]]*)\]\([^)]*\)/g;

function section(body: string, heading: string): string {
	const match = body.match(new RegExp(`^##\\s+${heading}\\s*$`, "m"));
	if (match?.index === undefined) return "";

	const rest = body.slice(match.index + match[0].length);
	const next = rest.search(/^##\s+/m);
	return (next === -1 ? rest : rest.slice(0, next)).trim();
}

function hasContacts(body: string, source?: string): boolean {
	if (getCenterLinks(body, source).length > 0) return true;
	if (/\]\((mailto|tel):/i.test(body)) return true;
	if (section(body, "Адрес/Локация")) return true;
	return /^-\s*(Адрес|Телефон|Email|E-mail)\s*:/im.test(section(body, "Контакты"));
}

function hasAbout(body: string): boolean {
	const about = section(body, "О центре").replace(MARKDOWN_LINK, "$1");
	return about.length >= MIN_ABOUT_LENGTH && !TEMPLATE_ABOUT.test(about);
}

/**
 * Полнота карточки центра. Считается всегда по русской записи — она источник
 * правды; английская переводится с неё и может отставать.
 */
export function getCenterCompleteness(entry: CollectionEntry<"centers">): CenterCompleteness {
	const body = entry.body ?? "";
	const { data } = entry;

	const gaps: CenterGap[] = [];
	if (!hasContacts(body, data.source)) gaps.push("contacts");
	if (!hasAbout(body)) gaps.push("about");
	// Региональной организации хватает региона: города у неё нет по смыслу.
	if (!data.location?.city && !data.location?.region && data.type !== "Онлайн") gaps.push("city");
	if (!MARKDOWN_LINK.test(section(body, "Источники"))) gaps.push("sources");

	return { complete: gaps.length === 0, gaps };
}
