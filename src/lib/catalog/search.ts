import { normalizeSearchText } from "@/lib/center/searchText";
import type { CardIndexItem, SearchIndexItem, SearchResult } from "@/lib/types";

/**
 * Поиск по каталогу: точное вхождение, потом нечёткое через Fuse.
 *
 * Ранжирование отделено от вида: сюда приходит строка, отсюда уходит
 * упорядоченный список карточек. Ни одного обращения к DOM: ищем по тем же
 * записям каталога, из которых тулбар рисует сетку, - отдельного индекса,
 * который мог бы разойтись со свежими карточками, больше нет.
 *
 * Fuse подтягивается лениво: пока посетитель не начал искать, в бандл он не
 * попадает.
 */

interface FuseResult {
	item: SearchIndexItem;
	score?: number;
}

interface FuseInstance {
	search: (query: string) => FuseResult[];
}

type FuseConstructor = new (
	items: readonly SearchIndexItem[],
	options: {
		includeScore: boolean;
		ignoreLocation: boolean;
		threshold: number;
		minMatchCharLength: number;
		keys: { name: keyof SearchIndexItem; weight: number }[];
	},
) => FuseInstance;

/** Вес поля в нечётком поиске: название важнее города, город важнее описания. */
const FUSE_KEYS: { name: keyof SearchIndexItem; weight: number }[] = [
	{ name: "title", weight: 0.42 },
	{ name: "city", weight: 0.2 },
	{ name: "country", weight: 0.14 },
	{ name: "region", weight: 0.12 },
	{ name: "category", weight: 0.06 },
	{ name: "summary", weight: 0.03 },
];

/**
 * Сколько точных вхождений считаем самодостаточным ответом. Ниже порога
 * список дополняется нечёткими: «Берлинскй центр» находит один точный хит по
 * слову «центр» - и без добора это была бы вся выдача.
 */
const ENOUGH_EXACT = 5;

export interface CenterSearch {
	/** Пустой запрос возвращает весь каталог в исходном порядке. */
	run(query: string): Promise<SearchResult[]>;
}

export function createCenterSearch(cards: readonly CardIndexItem[]): CenterSearch {
	const cardById = new Map(cards.map((card) => [card.id, card]));
	let fusePromise: Promise<FuseInstance> | null = null;

	function loadFuse(): Promise<FuseInstance> {
		fusePromise ??= import("fuse.js").then(
			({ default: Fuse }) =>
				new (Fuse as unknown as FuseConstructor)(cards, {
					includeScore: true,
					ignoreLocation: true,
					threshold: 0.32,
					minMatchCharLength: 2,
					keys: FUSE_KEYS,
				}),
		);

		return fusePromise;
	}

	return {
		async run(query) {
			const needle = normalizeSearchText(query);
			if (!needle) return cards.map((item) => ({ item, score: 0 }));

			// Точное вхождение бьёт нечёткое: набравшему «Берлин» нужен Берлин,
			// а не «Берген» с хорошим score. Но «бьёт» - это про порядок, а не
			// про право вето: один случайный точный хит не должен прятать
			// хорошие нечёткие совпадения.
			const exact = cards
				.filter((card) => card.searchText.includes(needle))
				.map((item) => ({ item, score: 0.01 }))
				.sort((a, b) => a.item.order - b.item.order);

			// Точных хватает - за нечёткими не идём: это экономит загрузку Fuse
			// ровно в тех запросах, где он ничего не добавит.
			if (exact.length >= ENOUGH_EXACT) return exact;

			const byCard = new Map<string, SearchResult>();
			for (const result of exact) byCard.set(result.item.id, result);

			const fuse = await loadFuse();
			const fuzzy: SearchResult[] = [];

			for (const found of fuse.search(query)) {
				const item = cardById.get(found.item.id);
				if (!item || byCard.has(item.id)) continue;

				const result = { item, score: found.score ?? 1 };
				byCard.set(item.id, result);
				fuzzy.push(result);
			}

			fuzzy.sort((a, b) => a.score - b.score || a.item.order - b.item.order);

			// Точные - первыми, нечёткие - хвостом: список дополняется, а не
			// пересортировывается, когда к одному точному хиту нашлось десять
			// похожих.
			return [...exact, ...fuzzy];
		},
	};
}
