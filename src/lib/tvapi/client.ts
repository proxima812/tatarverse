import createClient from "openapi-fetch";
import type { components, paths } from "./schema";

/**
 * Клиент api.tatarverse.cc - каталог, заявки и модерация.
 *
 * Типы генерируются из OpenAPI сервера (`bun run api:types`): поменялся
 * контракт - перегенерировать, и `astro check` покажет, что сломалось.
 */
export const API_URL = "https://api.tatarverse.cc";
export const API_DOCS_URL = `${API_URL}/docs/`;
export const API_OPENAPI_URL = `${API_URL}/openapi.json`;

export type Schemas = components["schemas"];
export type CenterFields = Schemas["CenterFields"];
export type LocalizedMap = Record<string, Schemas["LocalizedText"]>;
export type LocalizedListMap = Record<string, Schemas["LocalizedList"]>;
export type PublicConfig = Schemas["PublicConfig"];
export type PublicCenterItem = Schemas["PublicCenterItem"];
export type PublicCenterCard = Schemas["PublicCenterCard"];
export type SubmissionView = Schemas["SubmissionView"];
export type ModeratorView = Schemas["ModeratorView"];

/** Ответ-ошибка сервера (`application/problem+json`) в виде исключения. */
export class ApiError extends Error {
	readonly status: number;
	readonly code: string;
	readonly fields: Record<string, string>;
	readonly problem: Partial<Schemas["ProblemDetails"]>;

	constructor(status: number, problem: Partial<Schemas["ProblemDetails"]> = {}) {
		super(problem.detail || problem.title || `HTTP ${status}`);
		this.status = status;
		this.code = problem.errorCode || problem.title || "";
		this.fields = (problem.fields as Record<string, string> | undefined) ?? {};
		this.problem = problem;
	}
}

/**
 * Разворачивает ответ openapi-fetch: данные или `ApiError`. 429 у сервера
 * бывает с пустым телом - тогда код ошибки ставим сами.
 */
export async function unwrap<T>(
	request: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
	let result: Awaited<typeof request>;
	try {
		result = await request;
	} catch {
		throw new ApiError(0, { errorCode: "network", detail: "" });
	}
	const { data, error, response } = result;
	if (response.ok) return data as T;
	const problem =
		error && typeof error === "object" ? (error as Partial<Schemas["ProblemDetails"]>) : {};
	if (!problem.errorCode && response.status === 429) problem.errorCode = "too_many_requests";
	throw new ApiError(response.status, problem);
}

/**
 * Публичная часть: каталог, конфиг, заявки. fetch берётся в момент запроса,
 * а не при создании клиента, - так его можно подменить в отладке.
 */
export const api = createClient<paths>({ baseUrl: API_URL, fetch: (request) => globalThis.fetch(request) });

let configPromise: Promise<PublicConfig> | undefined;

/** `/config` один на страницу: его читают и форма, и каталог (подписи стран). */
export function loadConfig(): Promise<PublicConfig> {
	configPromise ??= unwrap(api.GET("/config")).catch((error) => {
		configPromise = undefined;
		throw error;
	});
	return configPromise;
}

/** Числа у сервера (.NET) в схеме описаны как `number | string`. */
export const num = (value: number | string | null | undefined): number => Number(value ?? 0);

/** Загрузка картинки (multipart, поле `file`): openapi-fetch сам multipart не собирает. */
export async function uploadFile<T>(path: string, file: File, init: RequestInit = {}): Promise<T> {
	const body = new FormData();
	body.append("file", file);
	let response: Response;
	try {
		response = await fetch(`${API_URL}${path}`, { method: "POST", body, ...init });
	} catch {
		throw new ApiError(0, { errorCode: "network" });
	}
	if (response.ok) return response.json();
	throw new ApiError(response.status, await response.json().catch(() => ({})));
}
