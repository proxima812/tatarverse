/**
 * Режим Telegram Mini App (@tatarverse_bot).
 *
 * Сайт тот же, Telegram просто открывает его во встроенном WebView. Признак
 * запуска из Telegram - `tgWebAppData` в hash первой страницы; после переходов
 * hash пропадает, поэтому признак запоминается в sessionStorage, которая живёт
 * ровно столько, сколько открыт WebView. Обычным посетителям SDK не грузится.
 */

const SDK_URL = "https://telegram.org/js/telegram-web-app.js";
const SESSION_KEY = "tg-webapp";
/** Параметр `startapp` из ссылки t.me/tatarverse_bot/app?startapp=tbk-1. */
const CENTER_PARAM = /^tbk-\d+$/;

type TelegramWebApp = {
	initData: string;
	platform: string;
	ready(): void;
	expand(): void;
	disableVerticalSwipes?(): void;
	setHeaderColor(color: string): void;
	setBackgroundColor(color: string): void;
	setBottomBarColor?(color: string): void;
	openLink(url: string): void;
	openTelegramLink(url: string): void;
	isVersionAtLeast(version: string): boolean;
	initDataUnsafe: { start_param?: string };
	BackButton: {
		show(): void;
		hide(): void;
		onClick(callback: () => void): void;
	};
};

declare global {
	interface Window {
		Telegram?: { WebApp: TelegramWebApp };
	}
}

const root = document.documentElement;
const INIT_HASH = "tgWebAppData";

/**
 * Признак `data-tg` ставит ранний скрипт в <head> (Layout.astro), чтобы стили и
 * скрипты страницы знали о Mini App до первой отрисовки. Здесь - запасной путь.
 */
const launchedFromTelegram = () => {
	if ("tg" in root.dataset) return true;
	if (!location.hash.includes(INIT_HASH)) return false;
	try {
		sessionStorage.setItem(SESSION_KEY, "1");
	} catch {
		// Без sessionStorage режим продержится только на первой странице.
	}
	return true;
};

/**
 * SDK уже прочитал initData из hash и сохранил её в sessionStorage. Убираем её
 * из адреса: иначе подпись пользователя уезжает в «Скопировать ссылку»,
 * промпты для ИИ и аналитику, а якоря страницы не работают.
 */
const cleanLaunchHash = () => {
	if (!location.hash.includes(INIT_HASH)) return;
	history.replaceState(history.state, "", location.pathname + location.search);
};

const loadSdk = () =>
	new Promise<TelegramWebApp | null>((resolve) => {
		if (window.Telegram?.WebApp) return resolve(window.Telegram.WebApp);
		const script = document.createElement("script");
		script.src = SDK_URL;
		script.async = true;
		script.onload = () => resolve(window.Telegram?.WebApp ?? null);
		script.onerror = () => resolve(null);
		document.head.append(script);
	});

/** Шапка и фон Telegram в цвет темы сайта, в том числе после её смены. */
const syncColors = (tg: TelegramWebApp) => {
	if (!tg.isVersionAtLeast("6.1")) return;
	const apply = () => {
		const background = getComputedStyle(root).getPropertyValue("--color-background").trim();
		if (!/^#[0-9a-f]{6}$/i.test(background)) return;
		tg.setHeaderColor(background);
		tg.setBackgroundColor(background);
		if (tg.isVersionAtLeast("7.10")) tg.setBottomBarColor?.(background);
	};
	apply();
	new MutationObserver(apply).observe(root, {
		attributes: true,
		attributeFilter: ["class", "data-accent", "data-theme"],
	});
	addEventListener("pageshow", (event) => {
		if (event.persisted) apply();
	});
};

const SECONDARY_LOCALES = ["en", "tt"];

const homePath = () => {
	const language = root.dataset.language ?? "";
	return SECONDARY_LOCALES.includes(language) ? `/${language}/` : "/";
};

const isHomePage = () =>
	location.pathname === "/" ||
	SECONDARY_LOCALES.some((locale) => [`/${locale}`, `/${locale}/`].includes(location.pathname));

/** Открытые меню и шторка фильтров: «Назад» сначала закрывает их. */
const OVERLAY_CLOSE = [
	'[data-menu-list][data-state="open"] [data-menu-close]',
	"[data-filters-shell][data-sheet-open] [data-filters-close]",
].join(", ");

const openOverlayClose = () => document.querySelector<HTMLElement>(OVERLAY_CLOSE);

/**
 * Системная кнопка «Назад» Telegram вместо браузерной, которой в WebView нет.
 * На Android она же - аппаратная «Назад», поэтому на главной с открытым меню
 * кнопка тоже нужна, иначе жест закроет приложение целиком.
 */
const setupBackButton = (tg: TelegramWebApp) => {
	if (!tg.isVersionAtLeast("6.1")) return;

	const sync = () => {
		if (isHomePage() && !openOverlayClose()) tg.BackButton.hide();
		else tg.BackButton.show();
	};

	tg.BackButton.onClick(() => {
		const close = openOverlayClose();
		if (close) return close.click();
		if (isHomePage()) return;

		const cameFromSite = document.referrer.startsWith(location.origin);
		if (cameFromSite && history.length > 1) history.back();
		else location.href = homePath();
	});

	sync();
	new MutationObserver(sync).observe(document.body, {
		subtree: true,
		attributes: true,
		attributeFilter: ["data-state", "data-sheet-open"],
	});
	// Страница из bfcache: кнопку успела перенастроить другая страница.
	addEventListener("pageshow", (event) => {
		if (event.persisted) sync();
	});
};

/**
 * Внешние ссылки - в браузер, t.me - внутри Telegram, а не в этом WebView.
 * Свои ссылки с target="_blank" WebView открыл бы во внешнем браузере или
 * проигнорировал, поэтому они открываются здесь же.
 */
const setupLinks = (tg: TelegramWebApp) => {
	document.addEventListener("click", (event) => {
		if (event.defaultPrevented || event.button !== 0) return;
		const link = (event.target as Element | null)?.closest?.("a[href]");
		if (!(link instanceof HTMLAnchorElement) || link.hasAttribute("download")) return;

		const url = new URL(link.href, location.href);
		if (!/^https?:$/.test(url.protocol)) return;

		if (url.origin === location.origin) {
			if (link.target !== "_blank") return;
			event.preventDefault();
			location.href = url.href;
			return;
		}

		event.preventDefault();
		if (url.hostname === "t.me" || url.hostname === "telegram.me") tg.openTelegramLink(url.href);
		else tg.openLink(url.href);
	});
};

/** Ссылка вида ?startapp=tbk-1 сразу открывает карточку центра. */
const openStartCenter = (tg: TelegramWebApp) => {
	const param = tg.initDataUnsafe.start_param;
	if (!param || !CENTER_PARAM.test(param) || !location.hash.includes(INIT_HASH)) return false;
	location.replace(`/centers/${param}`);
	return true;
};

export async function initTelegram() {
	if (!launchedFromTelegram()) return;
	root.dataset.tg = "";

	const tg = await loadSdk();
	if (!tg?.initData) return;

	if (openStartCenter(tg)) return;
	cleanLaunchHash();
	tg.ready();
	tg.expand();
	// Иначе на iOS и Android прокрутка вверх в шторке или меню сворачивает
	// Mini App вместо того, чтобы листать содержимое.
	if (tg.isVersionAtLeast("7.7")) tg.disableVerticalSwipes?.();
	syncColors(tg);
	setupBackButton(tg);
	setupLinks(tg);
}
