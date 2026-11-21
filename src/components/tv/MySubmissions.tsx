import { api, ApiError, num, unwrap, type SubmissionView } from "@/lib/tvapi/client";
import { forgetSubmission, readSubmissions, rememberSubmission } from "@/lib/tvapi/mySubmissions";
import { formatDate, pickText } from "@/lib/tvapi/text";
import { createResource, createSignal, For, Match, Show, Switch } from "solid-js";
import { errorText, messages, type Lang, type T } from "./messages";
import { paths } from "./paths";
import { Button, Empty, inputClass, LinkButton, Loading, Notice } from "./ui";

const statusTone: Record<string, string> = {
	pending: "bg-muted text-muted-foreground",
	approved: "bg-accent-soft text-accent-soft-foreground",
	rejected: "bg-destructive/10 text-destructive",
	withdrawn: "bg-muted text-subtle-foreground",
};

async function lookup(): Promise<SubmissionView[]> {
	const stored = readSubmissions();
	if (!stored.length) return [];
	const result = await unwrap(api.POST("/submissions/lookup", { body: { tokens: stored.map((entry) => entry.token).slice(0, 50) } }));
	return result.data;
}

/** «Мои заявки»: статусы по ключам из localStorage, исправление и отзыв. */
export default function MySubmissions(props: { lang: Lang }) {
	const t = messages(props.lang);
	const [list, { refetch, mutate }] = createResource(lookup);
	const [key, setKey] = createSignal("");
	const [keyError, setKeyError] = createSignal("");

	const addByKey = async (event: SubmitEvent) => {
		event.preventDefault();
		const token = key().trim();
		if (!token) return;
		setKeyError("");
		try {
			const found = await unwrap(api.POST("/submissions/lookup", { body: { tokens: [token] } }));
			const view = found.data[0];
			if (!view) {
				setKeyError(t("my.keyNotFound"));
				return;
			}
			rememberSubmission({ id: num(view.id), token, createdAt: view.createdAt });
			setKey("");
			refetch();
		} catch (error) {
			setKeyError(errorText(error, props.lang));
		}
	};

	const replace = (view: SubmissionView) =>
		mutate((current) => current?.map((item) => (num(item.id) === num(view.id) ? view : item)));
	const forget = (id: number) => {
		forgetSubmission(id);
		mutate((current) => current?.filter((item) => num(item.id) !== id));
	};

	return (
		<div class="flex min-w-0 flex-col gap-8">
			<header class="flex min-w-0 flex-col gap-4">
				<h1 class="text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">{t("my.title")}</h1>
				<p class="max-w-3xl text-base leading-7 text-muted-foreground">{t("my.intro")}</p>
				<form class="flex max-w-xl flex-col gap-1.5" onSubmit={addByKey}>
					<label class="text-sm font-medium text-foreground" for="submission-key">
						{t("my.keyLabel")}
					</label>
					<div class="flex gap-2">
						<input
							id="submission-key"
							class={inputClass}
							value={key()}
							placeholder={t("my.keyPlaceholder")}
							autocomplete="off"
							onInput={(event) => setKey(event.currentTarget.value)}
						/>
						<Button type="submit" variant="outline">
							{t("my.keyAdd")}
						</Button>
					</div>
					<Show when={keyError()}>
						<span class="text-xs text-destructive" role="alert">
							{keyError()}
						</span>
					</Show>
				</form>
			</header>

			<Switch>
				<Match when={list.error}>
					<Notice tone="error">
						{errorText(list.error, props.lang)}{" "}
						<button type="button" class="cursor-pointer underline" onClick={() => refetch()}>
							{t("common.retry")}
						</button>
					</Notice>
				</Match>
				<Match when={list.loading && !list.latest}>
					<Loading label={t("common.loading")} />
				</Match>
				<Match when={list.latest?.length === 0}>
					<Empty icon="file-text" title={t("my.empty")} hint={t("my.emptyHint")}>
						<LinkButton href={paths.add(props.lang)} icon="plus">
							{t("my.add")}
						</LinkButton>
					</Empty>
				</Match>
				<Match when={list.latest}>
					<ul class="flex min-w-0 flex-col gap-4">
						<For each={list.latest}>
							{(view) => <SubmissionItem view={view} lang={props.lang} t={t} onChange={replace} onForget={forget} />}
						</For>
					</ul>
				</Match>
			</Switch>
		</div>
	);
}

function SubmissionItem(props: {
	view: SubmissionView;
	lang: Lang;
	t: T;
	onChange: (view: SubmissionView) => void;
	onForget: (id: number) => void;
}) {
	const t = props.t;
	const id = () => num(props.view.id);
	const [busy, setBusy] = createSignal(false);
	const [error, setError] = createSignal("");

	const withdraw = async () => {
		if (!confirm(t("my.withdrawConfirm"))) return;
		const token = readSubmissions().find((entry) => entry.id === id())?.token;
		if (!token) return;
		setBusy(true);
		setError("");
		try {
			props.onChange(
				await unwrap(api.DELETE("/submissions/{id}", { params: { path: { id: id() }, header: { "X-Submission-Token": token } } })),
			);
		} catch (cause) {
			setError(cause instanceof ApiError && cause.code === "not_pending" ? t("my.keyNotFound") : errorText(cause, props.lang));
		} finally {
			setBusy(false);
		}
	};

	return (
		<li id={`submission-${id()}`} class="flex min-w-0 scroll-mt-24 flex-col gap-3 rounded-card corner-squircle bg-surface card-outline p-5 text-surface-foreground">
			<div class="flex flex-wrap items-center gap-2 text-xs">
				<span class={`rounded-full px-2.5 py-1 font-medium ${statusTone[props.view.status] ?? statusTone.pending}`}>
					{t(`my.status.${props.view.status}` as Parameters<T>[0])}
				</span>
				<span class="text-subtle-foreground">
					№{id()} · {t(props.view.kind === "edit" ? "my.kind.edit" : "my.kind.create")}
					{props.view.center ? ` · ${props.view.center}` : ""}
				</span>
			</div>
			<h2 class="text-lg font-semibold tracking-tight">{pickText(props.view.name, props.lang) || "-"}</h2>
			<dl class="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
				<dt class="text-muted-foreground">{t("my.sent")}</dt>
				<dd>{formatDate(props.view.createdAt, props.lang, true)}</dd>
				<Show when={props.view.decidedAt}>
					<dt class="text-muted-foreground">{t("my.decided")}</dt>
					<dd>{formatDate(props.view.decidedAt, props.lang, true)}</dd>
				</Show>
				<Show when={props.view.reason}>
					<dt class="text-muted-foreground">{t("my.reason")}</dt>
					<dd class="whitespace-pre-line">{props.view.reason}</dd>
				</Show>
				<Show when={props.view.kind === "edit" && props.view.changedFields.length}>
					<dt class="text-muted-foreground">{t("my.changed")}</dt>
					<dd class="text-subtle-foreground">{props.view.changedFields.join(", ")}</dd>
				</Show>
			</dl>
			<Show when={error()}>
				<Notice tone="error">{error()}</Notice>
			</Show>
			<div class="flex flex-wrap gap-2">
				<Show when={props.view.center}>
					<LinkButton href={paths.center(props.lang, props.view.center!)} variant="outline" size="xs" icon="arrow-up-right">
						{t("my.open")}
					</LinkButton>
				</Show>
				<Show when={props.view.status === "pending"}>
					<LinkButton href={paths.fix(props.lang, id())} variant="outline" size="xs" icon="pencil">
						{t("my.fix")}
					</LinkButton>
					<Button variant="ghost" size="xs" icon="x" busy={busy()} onClick={withdraw} class="hover:text-destructive">
						{t("my.withdraw")}
					</Button>
				</Show>
				<Show when={props.view.status !== "pending"}>
					<Button variant="ghost" size="xs" icon="trash" onClick={() => props.onForget(id())}>
						{t("my.forget")}
					</Button>
				</Show>
			</div>
		</li>
	);
}
