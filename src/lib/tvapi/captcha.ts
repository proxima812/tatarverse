/**
 * Невидимая Google reCAPTCHA v2. Скрипт грузится по требованию, виджет один
 * на форму; токен одноразовый, поэтому после каждой отправки - `reset()`.
 */
declare global {
	interface Window {
		grecaptcha?: {
			ready(callback: () => void): void;
			render(element: HTMLElement, options: Record<string, unknown>): number;
			execute(widget?: number): void;
			reset(widget?: number): void;
		};
		__tvCaptchaLoaded?: () => void;
	}
}

let scriptPromise: Promise<void> | undefined;

function loadScript(lang: string): Promise<void> {
	scriptPromise ??= new Promise((resolve, reject) => {
		window.__tvCaptchaLoaded = () => resolve();
		const script = document.createElement("script");
		script.src = `https://www.google.com/recaptcha/api.js?onload=__tvCaptchaLoaded&render=explicit&hl=${lang}`;
		script.async = true;
		script.onerror = () => {
			scriptPromise = undefined;
			reject(new Error("captcha_unavailable"));
		};
		document.head.append(script);
	});
	return scriptPromise;
}

export interface Captcha {
	/** Новый токен: проходит капчу (обычно без окна) и отдаёт ответ. */
	token(): Promise<string>;
	reset(): void;
}

export async function createCaptcha(
	element: HTMLElement,
	siteKey: string | null | undefined,
	lang: string,
): Promise<Captcha> {
	// Ключа нет - капча выключена на сервере (разработка): шлём пустой токен.
	if (!siteKey) return { token: async () => "", reset() {} };

	await loadScript(lang);
	const grecaptcha = window.grecaptcha!;
	let pending: ((token: string) => void) | null = null;
	let failed: ((error: Error) => void) | null = null;

	const widget = grecaptcha.render(element, {
		sitekey: siteKey,
		size: "invisible",
		badge: "inline",
		callback: (token: string) => pending?.(token),
		"error-callback": () => failed?.(new Error("captcha_failed")),
		"expired-callback": () => failed?.(new Error("captcha_failed")),
	});

	return {
		token: () =>
			new Promise<string>((resolve, reject) => {
				pending = resolve;
				failed = reject;
				grecaptcha.execute(widget);
			}),
		reset: () => grecaptcha.reset(widget),
	};
}
