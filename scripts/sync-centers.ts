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
 * Правило «карточка API → поля центра» общее с живым каталогом в браузере:
 * `src/lib/center/apiCard.ts`.
 *
 * Запуск: `bun scripts/sync-centers.ts` (входит в dev, build и check).
 * Нет сети или API отвечает ошибкой - остаются прежние файлы.
 */
import fs from "node:fs";
import path from "node:path";
import { centerBody, centerData, type ExportCard, type ExportResponse } from "../src/lib/center/apiCard.ts";
import { completenessOf } from "../src/lib/center/completeness.ts";

const API = process.env.TATARVERSE_API ?? "https://api.tatarverse.cc";

const TARGETS = {
	ru: path.resolve("src/data/centers_formatted"),
	en: path.resolve("src/data/centers_i18n/en"),
} as const;

type Lang = keyof typeof TARGETS;

async function fetchExport(lang: Lang): Promise<ExportCard[]> {
	const response = await fetch(`${API}/centers/export?lang=${lang}`, { headers: { Accept: "application/json" } });
	if (!response.ok) throw new Error(`GET /centers/export?lang=${lang}: HTTP ${response.status}`);
	const body = (await response.json()) as ExportResponse;
	if (!Array.isArray(body.data) || body.data.length === 0) {
		throw new Error(`GET /centers/export?lang=${lang}: пустая выгрузка`);
	}
	if (typeof body.total === "number" && body.total !== body.data.length) {
		throw new Error(`GET /centers/export?lang=${lang}: ${body.data.length} из ${body.total} карточек`);
	}
	return body.data;
}

const yaml = (value: string) => JSON.stringify(value);

function frontmatter(card: ExportCard, lang: Lang): string {
	const data = centerData(card, lang);
	const lines = [`title: ${yaml(data.title)}`];
	for (const key of ["type", "category", "source", "summary", "pubDate", "updatedAt"] as const) {
		const value = data[key];
		if (value) lines.push(`${key}: ${yaml(value)}`);
	}

	const place = (["country", "region", "district", "city"] as const)
		.map((key) => [key, data.location[key]] as const)
		.filter((entry): entry is readonly [typeof entry[0], string] => Boolean(entry[1]));
	if (place.length) {
		lines.push("location:", ...place.map(([key, value]) => `  ${key}: ${yaml(value)}`));
	}

	return `---\n${lines.join("\n")}\n---\n`;
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
		const content = frontmatter(card, lang) + centerBody(card, lang);
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

/**
 * Сводка для модулей, которые есть в воркере страницы центра: число центров и неполных (меню), центры
 * с английской версией (ссылки /en/) и все центры «от свежих» - для соседей и похожих на странице центра.
 * Коллекции утянули бы в воркер все карточки с текстами, а сводка - десятки КБ.
 * Лежит в git вместе со снимком: сборка без сети берёт прежнюю.
 */
function writeMeta(ru: ExportCard[], en: ExportCard[]) {
	const incomplete = ru.filter((card) => {
		const data = centerData(card, "ru");
		return !completenessOf({
			body: centerBody(card, "ru"),
			source: data.source,
			city: data.location.city,
			region: data.location.region,
			online: data.type === "Онлайн",
		}).complete;
	}).length;
	const byNumber = (a: string, b: string) => Number(a.slice(4)) - Number(b.slice(4));
	// Порядок «от свежих к старым» - как byRecency (src/lib/center/order.ts): дата, затем номер.
	const pubTime = (card: ExportCard) => (card.pubDate ? new Date(card.pubDate).getTime() : 0);
	const english = new Map(en.map((card) => [card.id, centerData(card, "en")]));
	const centers = [...ru]
		.sort((a, b) => pubTime(b) - pubTime(a) || byNumber(b.id, a.id))
		.map((card) => {
			const data = centerData(card, "ru");
			const translated = english.get(card.id);
			return {
				id: card.id,
				title: data.title,
				country: data.location.country ?? null,
				category: data.category ?? null,
				city: data.location.city ?? null,
				titleEn: translated?.title ?? null,
				cityEn: translated?.location.city ?? null,
			};
		});
	const translated = en.map((card) => card.id).sort(byNumber);
	const target = path.resolve("src/data/centers.meta.json");
	// Центр - одной строкой: правка карточки в истории git - одна строка, а не десяток.
	const content = [
		"{",
		`\t"count": ${ru.length},`,
		`\t"incomplete": ${incomplete},`,
		`\t"translated": ${JSON.stringify(translated)},`,
		`\t"centers": [`,
		centers.map((center) => `\t\t${JSON.stringify(center)}`).join(",\n"),
		"\t]",
		"}",
		"",
	].join("\n");
	if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== content) fs.writeFileSync(target, content);
}

try {
	const [ru, en] = await Promise.all([fetchExport("ru"), fetchExport("en")]);
	writeCollection("ru", ru);
	writeCollection("en", en);
	writeMeta(ru, en);
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	const hasSnapshot = fs.existsSync(TARGETS.ru) && fs.readdirSync(TARGETS.ru).some((file) => file.endsWith(".mdx"));
	if (!hasSnapshot) {
		console.error(`[centers] не удалось получить карточки из API: ${message}`);
		process.exit(1);
	}
	console.warn(`[centers] API недоступен (${message}) - сборка идёт на прежних файлах`);
}
