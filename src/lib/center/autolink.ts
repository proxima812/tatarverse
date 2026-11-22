/**
 * Голые адреса в тексте карточки - ссылками, как их делает GFM в Markdown собранной страницы:
 * «Instagram (https://instagram.com/x)» → ссылка без закрывающей скобки и точки в конце.
 * Нужен странице центра, которая рендерится по запросу без Markdown (`CenterBody.astro`).
 */

/** Перед открывающей кавычкой: начало строки, пробел, скобка, тире. */
const OPENING = String.raw`(^|[\s([{\u00ab\u2013\u2014-])`;

/**
 * Типографика как у smartypants в Markdown собранной страницы: прямые кавычки - «лапками» (“…”, ‘…’),
 * апостроф - ’, «--» и «---» - тире, «...» - многоточие.
 */
export const smartText = (text: string) =>
	text
		.replace(/\.\.\./g, "\u2026")
		.replace(/---?/g, "\u2014")
		.replace(new RegExp(`${OPENING}"`, "g"), "$1\u201c")
		.replace(/"/g, "\u201d")
		.replace(new RegExp(`${OPENING}'`, "g"), "$1\u2018")
		.replace(/'/g, "\u2019");

const URL_PATTERN = /https?:\/\/[^\s<>"]+/g;

export type TextPart = { text: string } | { url: string };

const count = (value: string, char: string) => value.split(char).length - 1;

export function autolink(text: string): TextPart[] {
	const parts: TextPart[] = [];
	let last = 0;
	for (const match of text.matchAll(URL_PATTERN)) {
		let url = match[0];
		// Хвостовую пунктуацию и непарную закрывающую скобку GFM в ссылку не берёт.
		while (/[.,;:!?'*_~]$/.test(url) || (url.endsWith(")") && count(url, "(") < count(url, ")"))) {
			url = url.slice(0, -1);
		}
		const start = match.index ?? 0;
		if (start > last) parts.push({ text: text.slice(last, start) });
		parts.push({ url });
		last = start + url.length;
	}
	if (last < text.length) parts.push({ text: text.slice(last) });
	return parts;
}
