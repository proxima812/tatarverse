import { createCaptcha, type Captcha } from "@/lib/tvapi/captcha";
import {
	api,
	ApiError,
	loadConfig,
	num,
	unwrap,
	uploadFile,
	type CenterFields,
	type PublicCenterCard,
	type PublicConfig,
	type Schemas,
} from "@/lib/tvapi/client";
import { findSubmission, rememberSubmission } from "@/lib/tvapi/mySubmissions";
import { pickText } from "@/lib/tvapi/text";
import { createResource, createSignal, Match, onMount, Show, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import { createDraft, fieldError, toFields, type DraftSource } from "./centerDraft";
import CenterEditor, { Section } from "./CenterEditor";
import { errorText, messages, type Lang, type T } from "./messages";
import { paths } from "./paths";
import { Button, Empty, Field, Icon, inputClass, LinkButton, Loading, Notice, Select } from "./ui";

type Mode = { kind: "create" } | { kind: "edit"; code: string } | { kind: "fix"; id: number };

interface Loaded {
	config: PublicConfig;
	mode: Mode;
	source: DraftSource;
	title: string;
	baseVersion: number | null;
	currentLogo: string | null;
}

const SUBMITTER_KEY = "tatarverse:submitter";
type Submitter = Schemas["SubmitterInput"];

function readSubmitter(): Submitter {
	const empty: Submitter = { name: "", phone: "", telegram: "", email: "", role: "" };
	try {
		return { ...empty, ...JSON.parse(localStorage.getItem(SUBMITTER_KEY) ?? "{}") };
	} catch {
		return empty;
	}
}

function readMode(): Mode {
	const params = new URLSearchParams(location.search);
	const code = params.get("code")?.trim();
	const submission = Number(params.get("submission"));
	if (code) return { kind: "edit", code };
	if (submission > 0) return { kind: "fix", id: submission };
	return { kind: "create" };
}

/** Публичная карточка → поля заявки (карточка целиком, как требует правка). */
function cardToFields(card: PublicCenterCard, federalDistrict: string | null): CenterFields {
	return {
		name: card.name,
		summary: card.summary,
		about: card.about,
		category: card.categoryCode,
		online: card.online,
		country: card.location?.countryCode ?? null,
		region: card.location?.region ?? null,
		district: card.location?.district ?? null,
		city: card.location?.city ?? null,
		federalDistrict,
		address: card.address,
		latitude: card.coordinates ? num(card.coordinates.lat) : null,
		longitude: card.coordinates ? num(card.coordinates.lon) : null,
		links: card.links,
		leader: card.leader,
		phones: card.phones,
		emails: card.emails,
		features: card.features,
		facts: card.facts,
		sources: card.sources,
	};
}

async function load(lang: Lang): Promise<Loaded> {
	const mode = readMode();
	const config = await loadConfig();
	const formLang = config.languages.includes(lang) ? lang : config.languages[0];
	const base = { langs: [formLang], fallback: true };

	if (mode.kind === "edit") {
		const get = (l: string) =>
			unwrap(api.GET("/centers/{code}", { params: { path: { code: mode.code }, query: { lang: l } } }));
		const card = (await get(formLang)).data!;
		// Федеральный округ каталог отдаёт на языке страницы, а заявка ждёт
		// значение из config.federalDistricts (по-русски).
		const ruDistrict =
			formLang === "ru" ? card.location?.federalDistrict : (await get("ru")).data?.location?.federalDistrict;
		return {
			config,
			mode,
			source: { ...base, fields: cardToFields(card, ruDistrict ?? null) },
			title: pickText(card.name),
			baseVersion: num(card.version),
			currentLogo: card.logo?.thumb ?? null,
		};
	}

	if (mode.kind === "fix") {
		const stored = findSubmission(mode.id);
		if (!stored) throw new ApiError(404, { errorCode: "submission_not_found" });
		const view = await unwrap(
			api.GET("/submissions/{id}", {
				params: { path: { id: mode.id }, header: { "X-Submission-Token": stored.token } },
			}),
		);
		if (view.status !== "pending") throw new ApiError(409, { errorCode: "not_pending" });
		return {
			config,
			mode,
			source: { ...base, fields: view.data ?? null },
			title: pickText(view.name),
			baseVersion: null,
			currentLogo: view.logo,
		};
	}

	return { config, mode, source: { ...base, fields: null }, title: "", baseVersion: null, currentLogo: null };
}

/** «Добавить центр», «Предложить правку» и исправление своей заявки. */
export default function SubmitForm(props: { lang: Lang }) {
	const t = messages(props.lang);
	const [data, { refetch }] = createResource(() => load(props.lang));

	return (
		<div class="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-8">
			<Switch>
				<Match when={data.error}>
					<LoadError error={data.error} lang={props.lang} t={t} retry={refetch} />
				</Match>
				<Match when={data.loading}>
					<Loading label={t("common.loading")} />
				</Match>
				<Match when={data()}>{(loaded) => <FormBody loaded={loaded()} lang={props.lang} t={t} />}</Match>
			</Switch>
		</div>
	);
}

function LoadError(props: { error: unknown; lang: Lang; t: T; retry: () => void }) {
	const error = () => (props.error instanceof ApiError ? props.error : null);
	return (
		<Switch>
			<Match when={error()?.code === "center_not_found"}>
				<Empty title={props.t("center.notFound")} hint={props.t("center.notFoundHint")}>
					<LinkButton href={paths.catalog(props.lang)} variant="outline">
						{props.t("center.back")}
					</LinkButton>
				</Empty>
			</Match>
			<Match when={error()?.code === "submission_not_found" || error()?.code === "not_pending"}>
				<Empty title={props.t("my.keyNotFound")}>
					<LinkButton href={paths.my(props.lang)} variant="outline">
						{props.t("my.title")}
					</LinkButton>
				</Empty>
			</Match>
			<Match when={true}>
				<Notice tone="error">
					{errorText(props.error, props.lang)}{" "}
					<button type="button" class="cursor-pointer underline" onClick={props.retry}>
						{props.t("common.retry")}
					</button>
				</Notice>
			</Match>
		</Switch>
	);
}

function FormBody(props: { loaded: Loaded; lang: Lang; t: T }) {
	const t = props.t;
	const { config, mode, source } = props.loaded;
	const formLang = source.langs[0];
	const [draft, setDraft] = createStore(createDraft(source));
	const [submitter, setSubmitter] = createStore<Submitter>(readSubmitter());
	const [comment, setComment] = createSignal("");
	const [honeypot, setHoneypot] = createSignal("");
	const [logo, setLogo] = createSignal<{ key: string; thumb: string } | null>(null);
	const [removeLogo, setRemoveLogo] = createSignal(false);
	const [uploading, setUploading] = createSignal(false);
	const [errors, setErrors] = createSignal<Record<string, string>>({});
	const [problem, setProblem] = createSignal("");
	const [sending, setSending] = createSignal(false);
	const [sent, setSent] = createSignal<Schemas["SubmissionCreated"] | null>(null);

	let captchaElement!: HTMLDivElement;
	let captcha: Captcha | undefined;
	onMount(() => {
		if (!config.submissionsOpen) return;
		createCaptcha(captchaElement, config.captcha.siteKey, props.lang)
			.then((instance) => (captcha = instance))
			.catch(() => setProblem(errorText(new ApiError(503, { errorCode: "captcha_unavailable" }), props.lang)));
	});

	const title = () =>
		mode.kind === "edit"
			? t("form.titleEdit", { name: props.loaded.title })
			: mode.kind === "fix"
				? t("form.titleFix", { id: mode.id })
				: t("form.titleCreate");

	const upload = async (file: File | undefined) => {
		if (!file) return;
		setUploading(true);
		setErrors((current) => ({ ...current, logo: "" }));
		try {
			const uploaded = await uploadFile<Schemas["LogoUploaded"]>("/logos", file);
			setLogo({ key: uploaded.key, thumb: uploaded.thumb });
		} catch (error) {
			setErrors((current) => ({ ...current, logo: errorText(error, props.lang) }));
		} finally {
			setUploading(false);
		}
	};

	const submit = async (event: SubmitEvent) => {
		event.preventDefault();
		setErrors({});
		setProblem("");
		if (!draft.text.name[formLang]?.trim()) {
			setErrors({ name: t("form.nameRequired") });
			setProblem(t("form.fixErrors"));
			return;
		}
		setSending(true);
		try {
			const captchaToken = captcha ? await captcha.token() : "";
			const body: Schemas["SubmissionRequest"] = {
				center: toFields(draft, source),
				baseVersion: props.loaded.baseVersion,
				logo: logo()?.key ?? null,
				removeLogo: removeLogo(),
				submitter: { ...submitter },
				comment: comment().trim() || null,
				language: formLang,
				captchaToken,
				website: honeypot(),
			};
			localStorage.setItem(SUBMITTER_KEY, JSON.stringify(submitter));

			if (mode.kind === "fix") {
				const stored = findSubmission(mode.id)!;
				const view = await unwrap(
					api.PUT("/submissions/{id}", {
						params: { path: { id: mode.id }, header: { "X-Submission-Token": stored.token } },
						body,
					}),
				);
				location.href = `${paths.my(props.lang)}#submission-${num(view.id)}`;
				return;
			}

			const created = await unwrap(
				mode.kind === "edit"
					? api.POST("/centers/{code}/submissions", { params: { path: { code: mode.code } }, body })
					: api.POST("/submissions", { body }),
			);
			rememberSubmission({ id: num(created.id), token: created.token, createdAt: created.createdAt });
			setSent(created);
			window.scrollTo({ top: 0, behavior: "smooth" });
		} catch (error) {
			if (error instanceof ApiError) setErrors(error.fields);
			setProblem(errorText(error, props.lang));
		} finally {
			captcha?.reset();
			setSending(false);
		}
	};

	const roles = () => config.roles.map((role) => ({ value: role.code, label: props.lang === "en" ? role.en : role.ru }));
	const contactError = () => fieldError(errors(), "submitter.contact");

	return (
		<Show
			when={!sent()}
			fallback={
				<Sent created={sent()!} lang={props.lang} t={t} />
			}
		>
			<header class="flex min-w-0 flex-col gap-4">
				<h1 class="text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">{title()}</h1>
				<p class="max-w-3xl text-base leading-7 text-muted-foreground">
					{mode.kind === "create" ? t("form.introCreate") : t("form.introEdit")}
				</p>
				<Show when={formLang !== "ru" && mode.kind !== "create"}>
					<Notice>{t("form.translationHint")}</Notice>
				</Show>
			</header>

			<Show when={config.submissionsOpen} fallback={<Notice tone="error">{t("form.closed")}</Notice>}>
				<form class="flex min-w-0 flex-col gap-6" onSubmit={submit} novalidate>
					<CenterEditor
						draft={draft}
						setDraft={setDraft}
						config={config}
						langs={source.langs}
						lang={props.lang}
						t={t}
						errors={errors()}
					/>

					<Show when={config.logos.enabled}>
						<Section title={t("form.logo")}>
							<div class="flex flex-wrap items-center gap-4">
								<Show when={props.loaded.currentLogo && !logo()}>
									<figure class="flex flex-col items-center gap-1 text-xs text-subtle-foreground">
										<img src={props.loaded.currentLogo!} alt="" class="size-16 rounded-full object-cover" classList={{ "opacity-40": removeLogo() }} />
										<figcaption>{t("form.logoCurrent")}</figcaption>
									</figure>
								</Show>
								<Show when={logo()}>
									<figure class="flex flex-col items-center gap-1 text-xs text-subtle-foreground">
										<img src={logo()!.thumb} alt="" class="size-16 rounded-full object-cover" />
										<figcaption>{t("form.logoNew")}</figcaption>
									</figure>
								</Show>
								<div class="flex flex-col gap-2">
									<label class="inline-flex cursor-pointer">
										<input
											type="file"
											accept="image/png,image/jpeg,image/webp"
											class="sr-only"
											onChange={(event) => upload(event.currentTarget.files?.[0])}
										/>
										<span class="inline-flex items-center gap-1.5 rounded-control corner-squircle bg-white px-4 py-2 text-sm font-medium text-primary/80 ring ring-primary/10 ring-inset transition hover:bg-primary/5 dark:bg-surface">
											<Icon name={uploading() ? "loader-2" : "upload"} class={uploading() ? "animate-spin" : ""} />
											{t("form.logoUpload")}
										</span>
									</label>
									<Show when={logo()}>
										<Button variant="ghost" size="xs" icon="trash" onClick={() => setLogo(null)}>
											{t("form.logoRemove")}
										</Button>
									</Show>
									<Show when={props.loaded.currentLogo && !logo()}>
										<label class="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
											<input type="checkbox" class="size-4 accent-(--color-accent)" checked={removeLogo()} onChange={(event) => setRemoveLogo(event.currentTarget.checked)} />
											{t("form.logoRemoveCurrent")}
										</label>
									</Show>
								</div>
							</div>
							<p class="text-xs" classList={{ "text-destructive": Boolean(errors().logo), "text-subtle-foreground": !errors().logo }}>
								{errors().logo || t("form.logoHint", { size: Math.round(num(config.logos.maxBytes) / 1048576) })}
							</p>
						</Section>
					</Show>

					<Section title={t("form.section.submitter")}>
						<div class="grid min-w-0 gap-5 sm:grid-cols-2">
							<Field label={t("form.submitterName")} error={fieldError(errors(), "submitter.name")}>
								<input
									class={inputClass}
									autocomplete="name"
									value={submitter.name ?? ""}
									maxLength={num(config.limits.submitterNameMax)}
									aria-invalid={Boolean(fieldError(errors(), "submitter.name"))}
									onInput={(event) => setSubmitter("name", event.currentTarget.value)}
								/>
							</Field>
							<Field label={t("form.role")} error={fieldError(errors(), "submitter.role")}>
								<Select
									value={submitter.role ?? ""}
									placeholder={t("form.categoryPick")}
									options={roles()}
									aria-invalid={Boolean(fieldError(errors(), "submitter.role"))}
									onChange={(event) => setSubmitter("role", event.currentTarget.value)}
								/>
							</Field>
						</div>
						<div class="grid min-w-0 gap-5 sm:grid-cols-3">
							<Field label={t("form.phone")} error={fieldError(errors(), "submitter.phone")}>
								<input class={inputClass} type="tel" autocomplete="tel" value={submitter.phone ?? ""} aria-invalid={Boolean(contactError())} onInput={(event) => setSubmitter("phone", event.currentTarget.value)} />
							</Field>
							<Field label={t("form.telegram")} error={fieldError(errors(), "submitter.telegram")}>
								<input class={inputClass} placeholder="@username" value={submitter.telegram ?? ""} aria-invalid={Boolean(contactError())} onInput={(event) => setSubmitter("telegram", event.currentTarget.value)} />
							</Field>
							<Field label={t("form.email")} error={fieldError(errors(), "submitter.email")}>
								<input class={inputClass} type="email" autocomplete="email" value={submitter.email ?? ""} aria-invalid={Boolean(contactError())} onInput={(event) => setSubmitter("email", event.currentTarget.value)} />
							</Field>
						</div>
						<p class="text-xs" classList={{ "text-destructive": Boolean(contactError()), "text-subtle-foreground": !contactError() }}>
							{contactError() || t("form.contactHint")}
						</p>
						<Field label={t("form.comment")} hint={t("form.commentHint")} optional={t("common.optional")} error={fieldError(errors(), "comment")}>
							<textarea
								class={`${inputClass} min-h-24 leading-6`}
								rows={3}
								maxLength={num(config.limits.commentMax)}
								value={comment()}
								onInput={(event) => setComment(event.currentTarget.value)}
							/>
						</Field>
						{/* Ловушка для ботов: человек это поле не видит. */}
						<input
							type="text"
							name="website"
							tabIndex={-1}
							autocomplete="off"
							aria-hidden="true"
							class="absolute -left-[9999px] size-px opacity-0"
							value={honeypot()}
							onInput={(event) => setHoneypot(event.currentTarget.value)}
						/>
					</Section>

					<Show when={problem()}>
						<Notice tone="error">{problem()}</Notice>
					</Show>

					<div class="flex flex-col gap-3">
						<Button type="submit" busy={sending() || uploading()} icon="check" class="self-start">
							{sending() ? t("form.sending") : mode.kind === "fix" ? t("form.submitFix") : t("form.submit")}
						</Button>
						<p class="text-xs text-subtle-foreground">
							{t("form.consent")}{" "}
							<a href={paths.policy(props.lang)} class="underline">
								{t("form.policy")}
							</a>
							. {t("form.captchaNotice")}
						</p>
						<div ref={captchaElement} />
					</div>
				</form>
			</Show>
		</Show>
	);
}

function Sent(props: { created: Schemas["SubmissionCreated"]; lang: Lang; t: T }) {
	const t = props.t;
	return (
		<section class="flex min-w-0 flex-col items-center gap-5 rounded-catalog corner-squircle bg-surface card-outline px-6 py-14 text-center text-surface-foreground">
			<Icon name="circle-check" class="size-10 text-accent" />
			<h1 class="text-2xl font-semibold tracking-tight">{t("form.sentTitle", { id: num(props.created.id) })}</h1>
			<p class="max-w-lg text-sm leading-6 text-muted-foreground">{t("form.sentText")}</p>
			<div class="flex max-w-full flex-col gap-1.5">
				<span class="text-xs text-subtle-foreground">{t("form.sentKey")}</span>
				<code class="max-w-full select-all break-all rounded-control bg-muted px-3 py-2 text-xs text-foreground">
					{props.created.token}
				</code>
			</div>
			<div class="flex flex-wrap justify-center gap-3">
				<LinkButton href={paths.my(props.lang)} icon="list-check">
					{t("form.toMy")}
				</LinkButton>
				<LinkButton href={paths.add(props.lang)} variant="outline" icon="plus">
					{t("form.another")}
				</LinkButton>
			</div>
		</section>
	);
}
