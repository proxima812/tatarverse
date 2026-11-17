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

const readSession = () => {
	try {
		return sessionStorage.getItem(SESSION_KEY) === "1";
	} catch {
		return false;
	}
};

const rememberSession = () => {
	try {
		sessionStorage.setItem(SESSION_KEY, "1");
	} catch {
		// Без sessionStorage режим продержится только на первой странице.
	}
};

const launchedFromTelegram = () => {
	if (location.hash.includes("tgWebAppData")) {
		rememberSession();
		return true;
	}
	return readSession();
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
};

const homePath = () => (root.dataset.language === "en" ? "/en/" : "/");

/** Системная кнопка «Назад» Telegram вместо браузерной, которой в WebView нет. */
const setupBackButton = (tg: TelegramWebApp) => {
	if (!tg.isVersionAtLeast("6.1")) return;
	const isHome = location.pathname === "/" || location.pathname === "/en/" || location.pathname === "/en";
	if (isHome) return tg.BackButton.hide();

	tg.BackButton.show();
	tg.BackButton.onClick(() => {
		const cameFromSite = document.referrer.startsWith(location.origin);
		if (cameFromSite && history.length > 1) history.back();
		else location.href = homePath();
	});
};

/** Внешние ссылки - в браузер, t.me - внутри Telegram, а не в этом WebView. */
const setupLinks = (tg: TelegramWebApp) => {
	document.addEventListener("click", (event) => {
		if (event.defaultPrevented || event.button !== 0) return;
		const link = (event.target as Element | null)?.closest?.("a[href]");
		if (!(link instanceof HTMLAnchorElement)) return;

		const url = new URL(link.href, location.href);
		if (!/^https?:$/.test(url.protocol) || url.origin === location.origin) return;

		event.preventDefault();
		if (url.hostname === "t.me" || url.hostname === "telegram.me") tg.openTelegramLink(url.href);
		else tg.openLink(url.href);
	});
};

/** Ссылка вида ?startapp=tbk-1 сразу открывает карточку центра. */
const openStartCenter = (tg: TelegramWebApp) => {
	const param = tg.initDataUnsafe.start_param;
	if (!param || !CENTER_PARAM.test(param) || !location.hash.includes("tgWebAppData")) return false;
	location.replace(`/centers/${param}`);
	return true;
};

export async function initTelegram() {
	if (!launchedFromTelegram()) return;
	root.dataset.tg = "";

	const tg = await loadSdk();
	if (!tg?.initData) return;

	if (openStartCenter(tg)) return;
	tg.ready();
	tg.expand();
	syncColors(tg);
	setupBackButton(tg);
	setupLinks(tg);
}
