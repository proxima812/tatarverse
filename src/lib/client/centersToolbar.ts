import { getCountryLabel } from "@/data/worldCountries";
import type { AppLocale } from "@/i18n";
import { facetRecords, type CatalogCard, type CatalogPayload } from "@/lib/center/catalogCards";
import { buildCenterFacets, type Facet } from "@/lib/center/facets";
import { CARD_ATTR, CARD_PART, isFacetField, readCard, type CardField } from "@/lib/site/cardAttributes";
import { fillCard } from "@/lib/site/cardTemplate";
import { normalizeSearchText, uniqueTerms } from "@/lib/center/searchText";
import { syncSavedCenters } from "@/lib/client/savedCentersUi";
import { createCatalogFilter } from "@/lib/catalog/filterState";
import { readCatalogQuery, writeCatalogQuery, type CatalogSort } from "@/lib/catalog/query";
import { createCenterSearch } from "@/lib/catalog/search";
import { createSearchSuggestions } from "@/lib/catalog/suggestions";
import type {
	CardIndexItem,
	CenterScope,
	FacetKey,
	FilterGate,
	SearchResult,
} from "@/lib/types";

/**
 * Вид каталога: рисует чипы и карточки из каталога, слушает события,
 * показывает результат.
 *
 * Карточки приходят данными (`CatalogPayload`), а не разметкой: в HTML
 * только первая порция, остальное сетка дорисовывает по прокрутке, пока
 * в хвосте висят скелетоны. Чипы фильтров тоже собираются из каталога -
 * новая страна или город появляются в тулбаре без пересборки.
 *
 * Решения принимаются не здесь. Что показать - считает `filterState`, в каком
 * порядке - `search`, что положить в адрес - `query`, как вести себя списку
 * подсказок - `suggestions`. Этот файл переводит их ответы в DOM и обратно.
 */

const SEARCH_DEBOUNCE_MS = 150;
/** Клик по подсказке приходит после blur - даём ему успеть. */
const SUGGESTION_BLUR_DELAY_MS = 120;
const MIN_SUGGESTION_QUERY = 2;
const MAX_SUGGESTIONS = 6;
const SUGGESTION_SOURCE_LIMIT = 8;
/** Сколько карточек дорисовываем за раз. */
const BATCH_SIZE = 24;
/** За сколько до хвоста сетки начинаем дорисовывать. */
const PRELOAD_MARGIN = "800px 0px";

const TOKEN_CLASS =
	"group inline-flex max-w-full items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-sm font-medium text-primary-foreground transition hover:bg-primary/85";

const CARD_FIELDS = Object.keys(CARD_ATTR) as CardField[];

/** Собранная карточка совпадает с каталогом - узел можно оставить. */
function sameCard(element: HTMLElement, card: CatalogCard) {
	const fields = readCard(element);
	const href = element.querySelector(`[${CARD_PART.link}]`)?.getAttribute("href");
	return href === card.linkHref && CARD_FIELDS.every((field) => fields[field] === card[field]);
}

function renderCard(template: HTMLTemplateElement, card: CatalogCard, locale: string) {
	// На карточке страна подписана на языке страницы, без «Прочее»;
	// в атрибуте остаётся русский ключ фильтра.
	const shownCountry = card.country === "Прочее" ? "" : getCountryLabel(card.country, locale as AppLocale);
	const node = fillCard(template, { ...card, country: shownCountry }, { locale, linkHref: card.linkHref });
	const article = node?.querySelector<HTMLElement>(`[${CARD_ATTR.id}]`);
	article?.setAttribute(CARD_ATTR.country, card.country);
	return article ?? null;
}

/** Чипы секции - из свежих фасетов, кнопка «Все» остаётся из разметки. */
function renderChips(group: HTMLElement, facet: Facet, template: HTMLTemplateElement) {
	const chips = facet.options.flatMap((option) => {
		const chip = (template.content.cloneNode(true) as DocumentFragment)
			.querySelector<HTMLButtonElement>("[data-filter-chip]");
		if (!chip) return [];

		chip.dataset.filterChip = facet.key;
		chip.dataset.filterValue = option.value;
		const flag = chip.querySelector<HTMLElement>("[data-chip-flag]");
		if (option.flag && flag) flag.textContent = option.flag;
		else flag?.remove();
		const label = chip.querySelector<HTMLElement>("[data-chip-label]");
		if (label) label.textContent = option.label;
		const count = chip.querySelector<HTMLElement>("[data-chip-count]");
		if (count) count.textContent = String(option.count);
		return [chip];
	});

	for (const old of group.querySelectorAll("[data-filter-chip]")) old.remove();
	group.append(...chips);
}

export function initCardsToolbar(catalog: CatalogPayload) {
	const gridElement = document.getElementById("cards-grid");
	const noResultsElement = document.getElementById("no-results");
	const liveRoot = document.querySelector<HTMLElement>("[data-live-catalog]");
	const cardTemplateElement = liveRoot?.querySelector<HTMLTemplateElement>("template[data-card-template]");
	if (!gridElement || !noResultsElement || !cardTemplateElement) return;

	// Связываем после проверки: внутрь замыканий сужение типа не проходит.
	const cardsGrid = gridElement;
	const noResults = noResultsElement;
	const cardTemplate = cardTemplateElement;
	const moreElement = document.querySelector<HTMLElement>("[data-catalog-more]");
	const chipTemplate = liveRoot?.querySelector<HTMLTemplateElement>("template[data-chip-template]");
	const locale = liveRoot?.dataset.locale ?? document.documentElement.lang ?? "ru";

	const searchForm = document.querySelector<HTMLFormElement>("[data-search-form]");
	const searchInput = document.querySelector<HTMLInputElement>("[data-toolbar-search]");
	const suggestionList = document.querySelector<HTMLUListElement>("[data-search-suggestions]");
	const searchSubmit = document.querySelector<HTMLButtonElement>("[data-search-submit]");
	const searchClear = document.querySelector<HTMLButtonElement>("[data-search-clear]");
	const filtersToggle = document.querySelector<HTMLButtonElement>("[data-filters-toggle]");
	const filtersShell = document.querySelector<HTMLElement>("[data-filters-shell]");
	const filtersPanel = document.getElementById("filters-panel");
	const filtersBackdrop = document.querySelector<HTMLElement>("[data-filters-backdrop]");
	const filtersClose = document.querySelector<HTMLButtonElement>("[data-filters-close]");
	const sheetApply = document.querySelector<HTMLButtonElement>("[data-sheet-apply]");
	const sortSelect = document.querySelector<HTMLSelectElement>("[data-catalog-sort]");
	const filtersBadge = document.querySelector<HTMLElement>("[data-filters-badge]");
	const filtersResetButtons =
		document.querySelectorAll<HTMLButtonElement>("[data-filters-reset]");
	const activeFiltersBar = document.querySelector<HTMLElement>("[data-active-filters-bar]");
	const activeFiltersTokens = document.querySelector<HTMLElement>(
		"[data-active-filters-tokens]",
	);
	const resultsCounters = Array.from(
		document.querySelectorAll<HTMLElement>("[data-results-count]"),
	);
	const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-filter-section]"));
	const groupElements = Array.from(
		document.querySelectorAll<HTMLElement>("[data-filter-group]"),
	);
	const scopeGroup = document.querySelector<HTMLElement>("[data-scope-group]");
	const scopeButtons = Array.from(
		document.querySelectorAll<HTMLButtonElement>("[data-scope-value]"),
	);
	const scopeAllButton = document.querySelector<HTMLButtonElement>("[data-scope-all]");

	// --- каталог -> чипы ----------------------------------------------------

	if (chipTemplate) {
		const facets = buildCenterFacets(facetRecords(catalog.cards), locale as AppLocale);
		for (const facet of facets.facets) {
			const group = groupElements.find((element) => element.dataset.filterGroup === facet.key);
			if (group) renderChips(group, facet, chipTemplate);
		}
	}

	const facetKeys: FacetKey[] = groupElements
		.map((group) => group.dataset.filterGroup ?? "")
		.filter(Boolean);

	// --- каталог -> модель --------------------------------------------------

	const cards: CardIndexItem[] = catalog.cards.map((card, order) => {
		const { country, type, category, region, title, summary, city, district, localTerms } = card;
		const facets: Record<FacetKey, string> = {};
		for (const key of facetKeys) facets[key] = isFacetField(key) ? card[key] : "";

		return {
			id: card.id,
			card,
			scope: card.scope as CenterScope,
			facets,
			country,
			type,
			category,
			region,
			title,
			summary,
			city,
			order,
			terms: uniqueTerms([title, city, country, region, district, category, ...localTerms]),
			searchText: normalizeSearchText(
				[title, summary, city, country, type, category, region, district, ...localTerms].join(" "),
			),
		};
	});

	// Узлы карточек создаём, только когда до них долистали. Собранные на
	// сервере оставляем, если они совпадают с каталогом: без мигания.
	const elements = new Map<string, HTMLElement>();
	const cardById = new Map(catalog.cards.map((card) => [card.id, card]));
	for (const element of cardsGrid.querySelectorAll<HTMLElement>(`:scope > [${CARD_ATTR.id}]`)) {
		const id = element.getAttribute(CARD_ATTR.id) ?? "";
		const card = cardById.get(id);
		if (card && sameCard(element, card)) elements.set(id, element);
	}

	function elementFor(item: CardIndexItem): HTMLElement | null {
		let element = elements.get(item.id);
		if (!element) {
			element = renderCard(cardTemplate, item.card, locale) ?? undefined;
			if (element) elements.set(item.id, element);
		}
		return element ?? null;
	}

	const filter = createCatalogFilter(cards, facetKeys);
	const search = createCenterSearch(cards);

	let searchQuery = "";
	let searchTimer = 0;
	let blurTimer = 0;
	let filterFrame = 0;
	// Подсказки, выдача и фильтры используют один результат, включая ещё идущий поиск.
	let cachedSearchQuery: string | undefined;
	let cachedSearch: Promise<SearchResult[]>;
	function runSearch(query: string) {
		if (query !== cachedSearchQuery) {
			cachedSearchQuery = query;
			cachedSearch = search.run(query);
		}
		return cachedSearch;
	}

	let limitedResults: SearchResult[] | undefined;
	let orderedQuery = "";
	let orderedSort: CatalogSort = "recency";
	let orderedCards = cards;
	let sortMode: CatalogSort = "recency";
	/** Запросы «найти в списке» внутри длинных секций фильтров. */
	const facetQueries = new Map<string, string>();

	const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const isDesktopLayout = window.matchMedia("(min-width: 1024px)");

	// --- доступ к разметке фильтров ----------------------------------------

	// Разметка фильтров статична: ссылки и подписи читаем один раз.
	const facetViews = new Map(sections.map((section) => {
		const key = section.dataset.filterSection ?? "";
		const chips = Array.from(
			section.querySelectorAll<HTMLButtonElement>("[data-filter-chip]"),
		).map((element) => {
			const label = element.querySelector<HTMLElement>("[data-chip-label]")?.textContent ?? "";
			return {
				element,
				value: element.dataset.filterValue ?? "",
				count: element.querySelector<HTMLElement>("[data-chip-count]"),
				label: label.trim(),
				searchLabel: normalizeSearchText(label),
				flag: element.querySelector<HTMLElement>("[data-chip-flag]")?.textContent?.trim() ?? "",
			};
		});
		return [key, {
			section, chips,
			gate: (section.dataset.filterGate ?? "always") as FilterGate,
			all: section.querySelector<HTMLButtonElement>("[data-filter-all]"),
			more: section.querySelector<HTMLButtonElement>("[data-filter-more]"),
			badge: section.querySelector<HTMLElement>("[data-section-badge]"),
			limit: Number(groupElements.find((group) => group.dataset.filterGroup === key)?.dataset.filterLimit ?? 0),
		}];
	}));
	const groupChips = (key: FacetKey) =>
		facetViews.get(key)?.chips.map((chip) => chip.element) ?? [];
	const allChip = (key: FacetKey) => facetViews.get(key)?.all;
	const moreButton = (key: FacetKey) => facetViews.get(key)?.more;
	const allowedValues = (key: FacetKey) =>
		new Set(facetViews.get(key)?.chips.map((chip) => chip.value).filter(Boolean));
	const scopeCountElements = new Map(scopeButtons.map((button) => [
		button, button.querySelector<HTMLElement>("[data-scope-count]"),
	]));
	const scopeAllCount = scopeAllButton?.querySelector<HTMLElement>("[data-scope-count]");

	function setText(element: HTMLElement | null | undefined, value: string) {
		if (element && element.textContent !== value) element.textContent = value;
	}

	function setHidden(element: HTMLElement, hidden: boolean) {
		if (element.hidden !== hidden) element.hidden = hidden;
	}

	function setActive(element: HTMLElement | null | undefined, active: boolean) {
		if (!element) return;
		if (element.hasAttribute("data-active") !== active) {
			element.toggleAttribute("data-active", active);
		}
		const pressed = String(active);
		if (element.getAttribute("aria-pressed") !== pressed) element.setAttribute("aria-pressed", pressed);
	}

	// --- сетка: порции по прокрутке ---------------------------------------

	/** Карточки текущей выдачи по порядку и сколько из них уже в сетке. */
	let visibleItems: CardIndexItem[] = [];
	let renderedCount = 0;

	/** Привести сетку к списку узлов, не трогая тех, что уже на месте. */
	function placeCards(nodes: HTMLElement[]) {
		let next = cardsGrid.firstElementChild;
		for (const node of nodes) {
			if (node === next) next = next.nextElementSibling;
			else cardsGrid.insertBefore(node, next);
		}
		while (next) {
			const after = next.nextElementSibling;
			next.remove();
			next = after;
		}
	}

	function renderGrid(count: number) {
		renderedCount = Math.min(count, visibleItems.length);
		placeCards(
			visibleItems
				.slice(0, renderedCount)
				.map(elementFor)
				.filter((element): element is HTMLElement => Boolean(element)),
		);
		if (moreElement) setHidden(moreElement, renderedCount >= visibleItems.length);
		// Кнопки «сохранить» новых карточек ещё не знают, что лежит в закладках.
		syncSavedCenters();
		watchTail();
	}

	const tailObserver =
		moreElement &&
		new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				if (renderedCount < visibleItems.length) renderGrid(renderedCount + BATCH_SIZE);
			},
			{ rootMargin: PRELOAD_MARGIN },
		);

	/**
	 * Переподписка заново сообщает, виден ли хвост: на высоком экране он
	 * остаётся в зоне после порции, и без этого следующая бы не пришла.
	 */
	function watchTail() {
		if (!tailObserver || !moreElement) return;
		tailObserver.unobserve(moreElement);
		if (renderedCount < visibleItems.length) tailObserver.observe(moreElement);
	}

	// --- рендер -------------------------------------------------------------

	function scrollBehavior(): ScrollBehavior {
		return prefersReducedMotion.matches ? "auto" : "smooth";
	}

	function renderFacets(onlyKey?: FacetKey) {
		for (const [key, view] of facetViews) {
			if (onlyKey !== undefined && key !== onlyKey) continue;
			const { section, gate, chips, more, badge, limit } = view;
			const counts = filter.countFacet(key);
			const selected = filter.selected(key);
			const isExpanded = more?.dataset.expanded === "true";
			// Пока в секции набран запрос, лимит и «показать ещё» не действуют:
			// показываем все совпавшие по названию чипы.
			const facetQuery = normalizeSearchText(facetQueries.get(key) ?? "");

			let shown = 0;
			let hidden = 0;

			for (const { element: chip, value, count: countEl, searchLabel } of chips) {
				const count = counts.get(value) ?? 0;
				const isActive = selected.has(value);
				setText(countEl, String(count));
				setActive(chip, isActive);

				if (count === 0 && !isActive) {
					setHidden(chip, true);
					continue;
				}

				if (facetQuery) {
					const matches = searchLabel.includes(facetQuery);
					setHidden(chip, !matches && !isActive);
					if (!chip.hidden) shown += 1;
					continue;
				}

				const overLimit = limit > 0 && shown >= limit && !isActive && !isExpanded;
				setHidden(chip, overLimit);
				if (overLimit) hidden += 1;
				else shown += 1;
			}

			const isAllActive = selected.size === 0;
			setActive(view.all, isAllActive);

			if (more) {
				setHidden(more, Boolean(facetQuery) || (hidden === 0 && !isExpanded));
				setText(more, isExpanded
					? (more.dataset.showLess ?? "")
					: (more.dataset.showMore ?? "").replace("__COUNT__", String(hidden)));
			}

			if (badge) {
				setText(badge, String(selected.size));
				setHidden(badge, selected.size === 0);
			}

			// Секция с запросом без совпадений остаётся видимой: иначе пропал бы
			// и сам инпут, которым запрос можно стереть.
			setHidden(section, !filter.isSectionVisible(gate, key) || (shown === 0 && !facetQuery));
		}

		if (onlyKey !== undefined) return;

		const scopeCounts = filter.countScopes();
		let scopeTotal = 0;

		for (const button of scopeButtons) {
			const value = button.dataset.scopeValue ?? "";
			const isActive = filter.scope === value;
			const count = scopeCounts.get(value) ?? 0;
			scopeTotal += count;

			setActive(button, isActive);
			setHidden(button, count === 0 && !isActive);
			setText(scopeCountElements.get(button), String(count));
		}

		setText(scopeAllCount, String(scopeTotal));
		setActive(scopeAllButton, filter.scope === "");
		if (scopeGroup) setHidden(scopeGroup, scopeButtons.length === 0);
	}

	function createToken(label: string, onRemove: () => void, flag = "") {
		const removeLabel = activeFiltersBar?.dataset.removeLabel ?? "";
		const token = document.createElement("button");
		token.type = "button";
		token.setAttribute("aria-label", removeLabel ? `${removeLabel}: ${label}` : label);
		token.className = TOKEN_CLASS;

		if (flag) {
			const flagEl = document.createElement("span");
			flagEl.className = "text-sm leading-none";
			flagEl.textContent = flag;
			token.append(flagEl);
		}

		const labelEl = document.createElement("span");
		labelEl.className = "min-w-0 truncate";
		labelEl.textContent = label;
		token.append(labelEl);

		const closeEl = document.createElement("span");
		closeEl.setAttribute("aria-hidden", "true");
		closeEl.className = "text-base leading-none opacity-80 transition group-hover:opacity-100";
		closeEl.textContent = "×";
		token.append(closeEl);

		token.addEventListener("click", onRemove);

		return token;
	}

	function chipMeta(key: FacetKey, value: string) {
		const chip = facetViews.get(key)?.chips.find((item) => item.value === value);
		return { label: chip?.label || value, flag: chip?.flag ?? "" };
	}

	function renderActiveFilters() {
		if (!activeFiltersTokens) return;
		activeFiltersTokens.replaceChildren();

		if (filter.scope) {
			const button = scopeButtons.find(
				(item) => item.dataset.scopeValue === filter.scope,
			);
			const label = button?.querySelector("span")?.textContent?.trim() ?? filter.scope;
			activeFiltersTokens.append(createToken(label, () => changeScope("")));
		}

		for (const key of facetKeys) {
			for (const value of filter.selected(key)) {
				const { label, flag } = chipMeta(key, value);
				activeFiltersTokens.append(
					createToken(label, () => toggleChip(key, value), flag),
				);
			}
		}

		const query = searchQuery.trim();
		if (query) activeFiltersTokens.append(createToken(`«${query}»`, clearSearchQuery));
	}

	function renderBadge() {
		const total = filter.activeCount();
		if (filtersBadge) {
			setText(filtersBadge, String(total));
			filtersBadge.classList.toggle("hidden", total === 0);
		}

		const hasAnything = total > 0 || searchQuery.trim().length > 0;
		filtersResetButtons.forEach((button) => {
			setHidden(button, !hasAnything);
		});
		if (activeFiltersBar) setHidden(activeFiltersBar, !hasAnything);
	}

	function syncSearchActions() {
		if (searchSubmit) searchSubmit.disabled = !searchInput?.value.trim();
		if (searchClear) searchClear.hidden = searchQuery.trim().length === 0;
	}

	function renderResultsCount(visible: number) {
		for (const counter of resultsCounters) {
			const template = counter.dataset.resultsTemplate ?? "{count}";
			setText(counter, template.replace("__COUNT__", String(visible)));
		}
		if (sheetApply) {
			const template = sheetApply.dataset.resultsTemplate ?? "__COUNT__";
			setText(sheetApply, template.replace("__COUNT__", String(visible)));
		}
	}

	// --- подсказки ----------------------------------------------------------

	const suggestions = createSearchSuggestions(suggestionList, searchInput, commitSuggestion);

	async function updateSuggestions() {
		const query = searchQuery.trim();
		if (query.length < MIN_SUGGESTION_QUERY) {
			suggestions.hide();
			return;
		}

		const needle = normalizeSearchText(query);
		const results = await runSearch(query);
		// Пока ждали, посетитель мог дописать запрос - эта выдача уже неактуальна.
		if (query !== searchQuery.trim()) return;

		const values = new Set<string>();
		for (const { item } of results.slice(0, SUGGESTION_SOURCE_LIMIT)) {
			const term = item.terms.find((candidate) =>
				normalizeSearchText(candidate).includes(needle),
			);
			values.add(term ?? item.title);
		}

		suggestions.show([...values].slice(0, MAX_SUGGESTIONS));
	}

	function commitSuggestion(value: string) {
		window.clearTimeout(searchTimer);
		searchQuery = value;
		if (searchInput) searchInput.value = value;
		syncSearchActions();
		suggestions.hide();
		schedule(true);
	}

	// --- действия -----------------------------------------------------------

	function toggleChip(key: FacetKey, value: string) {
		filter.toggle(key, value);
		filter.pruneEmpty();
		schedule(true);
	}

	function changeScope(next: CenterScope) {
		filter.setScope(next);
		schedule(true);
	}

	function resetFilters() {
		window.clearTimeout(searchTimer);
		filter.reset();
		searchQuery = "";
		if (searchInput) searchInput.value = "";
		suggestions.hide();
		schedule(true);
	}

	function clearSearchQuery() {
		window.clearTimeout(searchTimer);
		searchQuery = "";
		if (searchInput) {
			searchInput.value = "";
			searchInput.focus();
		}
		syncSearchActions();
		suggestions.hide();
		schedule(false);
	}

	function toggleOverflow(key: FacetKey) {
		const more = moreButton(key);
		if (!more) return;

		more.dataset.expanded = String(more.dataset.expanded !== "true");
		renderFacets(key);
	}

	const pageLang = document.documentElement.lang || undefined;

	/** Порядок без поиска: свежесть (исходный), алфавит или страна. */
	function sortedCards(): typeof cards {
		if (sortMode === "alpha") {
			return [...cards].sort(
				(a, b) => a.title.localeCompare(b.title, pageLang) || a.order - b.order,
			);
		}
		if (sortMode === "country") {
			return [...cards].sort(
				(a, b) =>
					a.country.localeCompare(b.country, pageLang) ||
					a.title.localeCompare(b.title, pageLang) ||
					a.order - b.order,
			);
		}
		return cards;
	}

	async function apply(shouldScroll = false) {
		const query = searchQuery.trim();
		const ranked = await runSearch(query);
		if (query !== searchQuery.trim()) return;

		if (ranked !== limitedResults) {
			filter.limitTo(query ? new Set(ranked.map((result) => result.item.id)) : null);
			limitedResults = ranked;
		}
		filter.pruneEmpty();

		// При поиске побеждает релевантность, селект сортировки замирает.
		const effectiveSort = query ? "recency" : sortMode;
		if (query !== orderedQuery || effectiveSort !== orderedSort) {
			const rank = new Map(ranked.map((result, index) => [result.item.id, index]));
			orderedCards = query
				? [...cards].sort((a, b) =>
					(rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
					(rank.get(b.id) ?? Number.MAX_SAFE_INTEGER) || a.order - b.order)
				: sortedCards();
			orderedQuery = query;
			orderedSort = effectiveSort;
		}

		if (sortSelect) sortSelect.disabled = Boolean(query);
		const nextItems = orderedCards.filter((item) => filter.matches(item));
		// Выдача не изменилась - дорисованное по прокрутке не сворачиваем.
		const sameItems =
			nextItems.length === visibleItems.length &&
			nextItems.every((item, index) => item === visibleItems[index]);
		visibleItems = nextItems;
		const visible = visibleItems.length;
		renderGrid(sameItems ? Math.max(renderedCount, BATCH_SIZE) : BATCH_SIZE);

		renderFacets();
		setHidden(noResults, visible > 0);
		renderBadge();
		renderResultsCount(visible);
		syncSearchActions();
		renderActiveFilters();

		window.history.replaceState(
			null,
			"",
			writeCatalogQuery(
				window.location.href,
				{ ...filter.snapshot(), search: searchQuery, sort: sortMode },
				facetKeys,
			),
		);

		// Пока открыта шторка, страница под ней заблокирована - прокрутка к
		// сетке случится при закрытии, из sheet-кнопки «Показать».
		if (shouldScroll && !isDesktopLayout.matches && !isSheetOpen()) {
			cardsGrid.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
		}
	}

	function schedule(shouldScroll = false) {
		window.cancelAnimationFrame(filterFrame);
		filterFrame = window.requestAnimationFrame(() => {
			void apply(shouldScroll);
		});
	}

	// --- шторка фильтров (мобилка) ------------------------------------------

	function isSheetOpen() {
		return filtersShell?.dataset.sheetOpen !== undefined;
	}

	function openSheet() {
		if (!filtersShell || !filtersPanel) return;

		filtersShell.classList.remove("hidden");
		filtersPanel.classList.remove("hidden");
		filtersShell.dataset.sheetOpen = "";
		if (filtersBackdrop) filtersBackdrop.hidden = false;
		filtersToggle?.setAttribute("aria-expanded", "true");
		document.documentElement.style.overflow = "hidden";
		filtersClose?.focus({ preventScroll: true });
	}

	function closeSheet(scrollToGrid = false) {
		if (!filtersShell || !isSheetOpen()) return;

		delete filtersShell.dataset.sheetOpen;
		filtersShell.classList.add("hidden");
		filtersPanel?.classList.add("hidden");
		if (filtersBackdrop) filtersBackdrop.hidden = true;
		filtersToggle?.setAttribute("aria-expanded", "false");
		document.documentElement.style.overflow = "";
		filtersToggle?.focus({ preventScroll: true });

		if (scrollToGrid) {
			cardsGrid.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
		}
	}

	// --- события ------------------------------------------------------------

	filtersToggle?.addEventListener("click", () => {
		if (isSheetOpen()) closeSheet();
		else openSheet();
	});
	filtersClose?.addEventListener("click", () => closeSheet());
	filtersBackdrop?.addEventListener("click", () => closeSheet());
	sheetApply?.addEventListener("click", () => closeSheet(true));
	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && isSheetOpen()) closeSheet();
	});
	// Растянули окно до десктопа со вскрытой шторкой - вернуть странице скролл:
	// сайдбар там показывается всегда, а замок остался бы навечно.
	isDesktopLayout.addEventListener("change", (event) => {
		if (event.matches) closeSheet();
	});

	sortSelect?.addEventListener("change", () => {
		sortMode = (sortSelect.value as CatalogSort) || "recency";
		schedule(false);
	});

	for (const input of document.querySelectorAll<HTMLInputElement>("[data-facet-filter]")) {
		const key = input.dataset.facetFilter ?? "";
		input.addEventListener("input", () => {
			facetQueries.set(key, input.value);
			renderFacets(key);
		});
		// Клик по summary закрыл бы секцию, пока посетитель тянется к инпуту.
		input.addEventListener("click", (event) => event.stopPropagation());
	}

	filtersResetButtons.forEach((button) => button.addEventListener("click", resetFilters));
	searchClear?.addEventListener("click", clearSearchQuery);

	searchForm?.addEventListener("submit", (event) => {
		event.preventDefault();
		if (!searchInput?.value.trim()) return;

		window.clearTimeout(searchTimer);
		searchQuery = searchInput.value;
		suggestions.hide();
		schedule(true);
	});

	for (const key of facetKeys) {
		allChip(key)?.addEventListener("click", () => {
			filter.resetGroup(key);
			schedule(true);
		});
		moreButton(key)?.addEventListener("click", () => toggleOverflow(key));

		for (const chip of groupChips(key)) {
			chip.addEventListener("click", () => {
				const value = chip.dataset.filterValue ?? "";
				if (value) toggleChip(key, value);
			});
		}
	}

	for (const button of scopeButtons) {
		button.addEventListener("click", () =>
			changeScope(button.dataset.scopeValue as CenterScope),
		);
	}
	scopeAllButton?.addEventListener("click", () => changeScope(""));

	searchInput?.addEventListener("input", (event) => {
		const value = (event.target as HTMLInputElement).value;
		if (searchSubmit) searchSubmit.disabled = !value.trim();
		if (searchClear) searchClear.hidden = value.trim().length === 0;

		window.clearTimeout(searchTimer);
		searchTimer = window.setTimeout(() => {
			searchQuery = value;
			void updateSuggestions();
			schedule(false);
		}, SEARCH_DEBOUNCE_MS);
	});

	searchInput?.addEventListener("keydown", (event) => {
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			if (suggestions.move(event.key === "ArrowDown" ? 1 : -1)) event.preventDefault();
			return;
		}

		if (event.key === "Enter") {
			const active = suggestions.active();
			if (active !== null) {
				event.preventDefault();
				commitSuggestion(active);
			}
			return;
		}

		if (event.key === "Escape") suggestions.hide();
	});

	searchInput?.addEventListener("focus", () => {
		window.clearTimeout(blurTimer);
		void updateSuggestions();
	});
	searchInput?.addEventListener("blur", () => {
		blurTimer = window.setTimeout(() => suggestions.hide(), SUGGESTION_BLUR_DELAY_MS);
	});

	// --- запуск -------------------------------------------------------------

	const initial = readCatalogQuery(
		window.location.search,
		facetKeys,
		allowedValues,
		(scope) => scopeButtons.some((button) => button.dataset.scopeValue === scope),
	);
	searchQuery = initial.search;
	if (searchInput) searchInput.value = searchQuery;
	sortMode = initial.sort;
	if (sortSelect) sortSelect.value = sortMode;
	filter.restore(initial);

	void apply();
}
