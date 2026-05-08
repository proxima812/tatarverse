import enDict from "@/i18n/locales/en";
import ruDict from "@/i18n/locales/ru";
import { isLanguage, type Dictionary, type Language } from "@/i18n/ui";

const STORAGE_KEY = "language";
const DEFAULT_LANGUAGE: Language = "ru";

const TRANSLATABLE_SELECTOR =
	"[data-i18n],[data-i18n-placeholder],[data-i18n-aria-label],[data-i18n-title],[data-i18n-date-only],[data-country-labels]";

type LanguageChangeDetail = {
	language: Language;
};

type TranslateableElement = HTMLElement & {
	dataset: DOMStringMap & {
		i18n?: string;
		i18nValues?: string;
		i18nDate?: string;
		i18nPlaceholder?: string;
		i18nAriaLabel?: string;
		i18nTitle?: string;
		i18nDateOnly?: string;
		countryLabels?: string;
	};
};

type ParsedCacheEntry = {
	values?: Record<string, string | number>;
	valuesRaw?: string;
	labels?: Partial<Record<Language, string>>;
	labelsRaw?: string;
};

declare global {
	interface Window {
		__ximaI18nRuntimeInitialized?: boolean;
		__ximaSetLanguage?: (language: Language) => void;
		__ximaApplyLanguage?: (language?: string | null) => void;
		__ximaTranslateNode?: (element: HTMLElement) => void;
		__ximaInvalidateI18nCache?: (element: HTMLElement) => void;
	}
}

// Module state
let currentApplied: Language | null = null;
let applyToken = 0;
const dictCache = new Map<Language, Dictionary>([
	["en", enDict],
	["ru", ruDict],
]);
const parsedCache = new WeakMap<Element, ParsedCacheEntry>();
const dtfFull = new Map<Language, Intl.DateTimeFormat>();
const dtfDate = new Map<Language, Intl.DateTimeFormat>();

function isSupportedLanguage(value: string | null | undefined): value is Language {
	return typeof value === "string" && isLanguage(value);
}

function getStoredLanguage(): Language {
	const value = window.localStorage.getItem(STORAGE_KEY);
	return isSupportedLanguage(value) ? value : DEFAULT_LANGUAGE;
}

async function loadDict(language: Language): Promise<Dictionary> {
	const cached = dictCache.get(language);
	if (cached) return cached;
	const mod = (await import(`./locales/${language}.ts`)) as { default: Dictionary };
	dictCache.set(language, mod.default);
	return mod.default;
}

function getCacheEntry(element: Element): ParsedCacheEntry {
	let entry = parsedCache.get(element);
	if (!entry) {
		entry = {};
		parsedCache.set(element, entry);
	}
	return entry;
}

function getValues(element: TranslateableElement): Record<string, string | number> {
	const raw = element.dataset.i18nValues ?? "";
	const entry = getCacheEntry(element);
	if (entry.values && entry.valuesRaw === raw) return entry.values;
	let parsed: Record<string, string | number> = {};
	if (raw) {
		try {
			parsed = JSON.parse(raw) as Record<string, string | number>;
		} catch {
			parsed = {};
		}
	}
	entry.values = parsed;
	entry.valuesRaw = raw;
	return parsed;
}

function getLabels(element: TranslateableElement): Partial<Record<Language, string>> {
	const raw = element.dataset.countryLabels ?? "";
	const entry = getCacheEntry(element);
	if (entry.labels && entry.labelsRaw === raw) return entry.labels;
	let parsed: Partial<Record<Language, string>> = {};
	if (raw) {
		try {
			parsed = JSON.parse(raw) as Partial<Record<Language, string>>;
		} catch {
			parsed = {};
		}
	}
	entry.labels = parsed;
	entry.labelsRaw = raw;
	return parsed;
}

function getFullFmt(language: Language): Intl.DateTimeFormat {
	let fmt = dtfFull.get(language);
	if (!fmt) {
		fmt = new Intl.DateTimeFormat(language, {
			day: "numeric",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
			timeZone: "Asia/Almaty",
		});
		dtfFull.set(language, fmt);
	}
	return fmt;
}

function getDateOnlyFmt(language: Language): Intl.DateTimeFormat {
	let fmt = dtfDate.get(language);
	if (!fmt) {
		fmt = new Intl.DateTimeFormat(language, {
			day: "numeric",
			month: "long",
			year: "numeric",
			timeZone: "Asia/Almaty",
		});
		dtfDate.set(language, fmt);
	}
	return fmt;
}

function interpolate(text: string, values: Record<string, string | number>): string {
	let result = text;
	for (const key in values) {
		result = result.replaceAll(`{${key}}`, String(values[key]));
	}
	return result;
}

function translate(
	dict: Dictionary,
	key: string,
	values: Record<string, string | number>,
): string {
	const raw = dict[key] ?? enDict[key] ?? key;
	return interpolate(raw, values);
}

function setText(element: HTMLElement, next: string) {
	if (element.textContent !== next) element.textContent = next;
}

function setAttr(element: HTMLElement, attr: string, next: string) {
	if (element.getAttribute(attr) !== next) element.setAttribute(attr, next);
}

function translateElement(
	element: TranslateableElement,
	language: Language,
	dict: Dictionary,
) {
	const ds = element.dataset;

	let valuesCached: Record<string, string | number> | null = null;
	const values = (): Record<string, string | number> => {
		if (valuesCached) return valuesCached;
		const v = { ...getValues(element) };
		if (ds.i18nDate) {
			v.date = getFullFmt(language).format(new Date(ds.i18nDate));
		}
		valuesCached = v;
		return v;
	};

	if (ds.i18n) {
		setText(element, translate(dict, ds.i18n, values()));
	}
	if (ds.i18nPlaceholder) {
		setAttr(element, "placeholder", translate(dict, ds.i18nPlaceholder, values()));
	}
	if (ds.i18nAriaLabel) {
		setAttr(element, "aria-label", translate(dict, ds.i18nAriaLabel, values()));
	}
	if (ds.i18nTitle) {
		setAttr(element, "title", translate(dict, ds.i18nTitle, values()));
	}
	if (ds.i18nDateOnly) {
		setText(element, getDateOnlyFmt(language).format(new Date(ds.i18nDateOnly)));
	}
	if (ds.countryLabels) {
		const labels = getLabels(element);
		const next = labels[language] ?? labels.en ?? element.textContent ?? "";
		setText(element, next);
	}
}

function applyAllTranslations(
	language: Language,
	dict: Dictionary,
	root: ParentNode = document,
) {
	const nodes = root.querySelectorAll<TranslateableElement>(TRANSLATABLE_SELECTOR);
	for (const el of nodes) translateElement(el, language, dict);
}

function syncLanguageToggle(language: Language) {
	const buttons = document.querySelectorAll<HTMLElement>(
		"[data-language-switcher] [data-language-option]",
	);
	for (const button of buttons) {
		const isActive = button.dataset.languageOption === language;
		const ariaNext = String(isActive);
		const tabNext = isActive ? "0" : "-1";
		if (button.getAttribute("aria-checked") !== ariaNext) {
			button.setAttribute("aria-checked", ariaNext);
		}
		if (button.getAttribute("tabindex") !== tabNext) {
			button.setAttribute("tabindex", tabNext);
		}
	}
}

function emitLanguageChange(language: Language) {
	window.dispatchEvent(
		new CustomEvent<LanguageChangeDetail>("languagechange", {
			detail: { language },
		}),
	);
}

export async function applyLanguage(
	value?: string | null,
	dispatchEvent = true,
	force = false,
) {
	const language = isSupportedLanguage(value) ? value : getStoredLanguage();
	const root = document.documentElement;

	if (root.lang !== language) root.lang = language;
	if (root.dataset.language !== language) root.dataset.language = language;

	// Immediate visual toggle feedback even before async dict load resolves.
	syncLanguageToggle(language);

	if (!force && currentApplied === language) {
		return;
	}

	const token = ++applyToken;
	const dict = await loadDict(language);
	// A newer applyLanguage() superseded this one — bail before mutating the DOM.
	if (token !== applyToken) return;

	applyAllTranslations(language, dict);

	const changed = currentApplied !== language;
	currentApplied = language;

	if (dispatchEvent && changed) {
		emitLanguageChange(language);
	}
}

export function setLanguage(language: Language) {
	window.localStorage.setItem(STORAGE_KEY, language);
	void applyLanguage(language);
}

export function translateNode(element: HTMLElement) {
	if (!currentApplied) return;
	const dict = dictCache.get(currentApplied);
	if (!dict) return;
	const root = element as TranslateableElement;
	if (root.matches?.(TRANSLATABLE_SELECTOR)) {
		translateElement(root, currentApplied, dict);
	}
	applyAllTranslations(currentApplied, dict, root);
}

export function invalidateI18nCache(element: Element) {
	parsedCache.delete(element);
}

function getButtons(): HTMLButtonElement[] {
	return Array.from(
		document.querySelectorAll<HTMLButtonElement>(
			"[data-language-switcher] [data-language-option]",
		),
	);
}

function handleToggleClick(event: MouseEvent) {
	const target = event.target;
	if (!(target instanceof Element)) return;
	const button = target.closest<HTMLElement>(
		"[data-language-switcher] [data-language-option]",
	);
	if (!button) return;
	const language = button.dataset.languageOption;
	if (isSupportedLanguage(language)) {
		setLanguage(language);
	}
}

function handleToggleKeydown(event: KeyboardEvent) {
	const target = event.target;
	if (!(target instanceof HTMLElement)) return;
	const button = target.closest<HTMLButtonElement>(
		"[data-language-switcher] [data-language-option]",
	);
	if (!button) return;

	const isNext = event.key === "ArrowRight" || event.key === "ArrowDown";
	const isPrev = event.key === "ArrowLeft" || event.key === "ArrowUp";
	if (!isNext && !isPrev) return;

	const buttons = getButtons();
	const currentIndex = buttons.indexOf(button);
	if (currentIndex < 0) return;

	const nextIndex = isNext
		? (currentIndex + 1) % buttons.length
		: (currentIndex - 1 + buttons.length) % buttons.length;
	if (nextIndex === currentIndex) return;

	event.preventDefault();
	const nextButton = buttons[nextIndex];
	nextButton?.focus();
	const nextLanguage = nextButton?.dataset.languageOption;
	if (isSupportedLanguage(nextLanguage)) {
		setLanguage(nextLanguage);
	}
}

function handleStorage(event: StorageEvent) {
	if (event.key !== STORAGE_KEY) return;
	if (isSupportedLanguage(event.newValue)) {
		void applyLanguage(event.newValue);
	}
}

function initCurrentPage() {
	void applyLanguage(getStoredLanguage(), false);
}

export function initI18nRuntime() {
	if (window.__ximaI18nRuntimeInitialized) {
		initCurrentPage();
		return;
	}

	window.__ximaI18nRuntimeInitialized = true;
	window.__ximaSetLanguage = setLanguage;
	window.__ximaApplyLanguage = (language) => {
		void applyLanguage(language, true, true);
	};
	window.__ximaTranslateNode = translateNode;
	window.__ximaInvalidateI18nCache = invalidateI18nCache;

	// Delegated listeners — bound once for the lifetime of the document
	document.addEventListener("click", handleToggleClick);
	document.addEventListener("keydown", handleToggleKeydown);
	window.addEventListener("storage", handleStorage);

	// Astro view transitions: re-run translation walk on swap; skip if language unchanged.
	document.addEventListener("astro:after-swap", initCurrentPage);
	document.addEventListener("astro:page-load", initCurrentPage);

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initCurrentPage, { once: true });
	} else {
		initCurrentPage();
	}
}
