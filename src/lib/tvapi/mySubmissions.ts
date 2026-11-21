/**
 * Ключи своих заявок. Сервер показывает ключ один раз, поэтому он живёт в
 * localStorage браузера: по нему «Мои заявки», исправление и отзыв.
 */
const STORAGE_KEY = "tatarverse:submissions";

export interface StoredSubmission {
	id: number;
	token: string;
	createdAt: string;
}

export function readSubmissions(): StoredSubmission[] {
	try {
		const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
		return Array.isArray(parsed) ? parsed.filter((entry) => entry?.token) : [];
	} catch {
		return [];
	}
}

function write(entries: StoredSubmission[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function rememberSubmission(entry: StoredSubmission) {
	write([entry, ...readSubmissions().filter((item) => item.id !== entry.id)]);
}

export function forgetSubmission(id: number) {
	write(readSubmissions().filter((item) => item.id !== id));
}

export function findSubmission(id: number): StoredSubmission | undefined {
	return readSubmissions().find((item) => item.id === id);
}
