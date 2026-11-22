import "@/lib/client/centerAvatars";
import { centerAvatarMarkup } from "@/lib/center/avatar";
import { api, ApiError, num, unwrap, type PublicCenterCard } from "@/lib/tvapi/client";
import { formatDate, pickItems, pickText, textLang } from "@/lib/tvapi/text";
import { createEffect, createResource, For, Match, Show, Switch, type JSX } from "solid-js";
import type { IconName } from "./icons";
import { messages, type Lang } from "./messages";
import { paths } from "./paths";
import { Empty, Icon, LinkButton, Loading } from "./ui";

/**
 * Живая страница центра: правка, одобренная в API, видна сразу, без
 * пересборки сайта.
 *
 * На собранной странице (`code` и `builtAt` переданы) остров сверяет
 * `updatedAt` карточки в API с тем, с которым страница собрана. Новее -
 * прячет собранную часть (`[data-center-static]`) и показывает карточку
 * из API. Совпало или API недоступен - не показывает ничего.
 *
 * На странице 404 (`code` не передан) берёт код из адреса
 * `/centers/tbk-N/`: так открывается центр, одобренный после сборки.
 */

const CENTER_PATH = /^\/(?:(en)\/)?centers\/(tbk-\d+)\/?$/;

const linkIcons: Record<string, IconName> = {
	instagram: "brand-instagram",
	telegram: "brand-telegram",
	whatsapp: "brand-whatsapp",
	vk: "brand-vk",
	youtube: "brand-youtube",
	facebook: "brand-facebook",
	tiktok: "brand-tiktok",
	x: "brand-x",
	twitter: "brand-x",
};

const display = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

const headingClass = "flex items-center justify-between gap-3 pb-1 text-sm text-muted-foreground";
const rowClass = "group flex min-h-13 min-w-0 items-center gap-3 py-2.5 text-sm text-foreground no-underline";

function Column(props: { title: string; count?: number; children: JSX.Element }) {
	return (
		<section class="min-w-0">
			<h2 class={headingClass}>
				{props.title}
				<Show when={props.count}>
					<span class="tabular-nums text-subtle-foreground">{props.count}</span>
				</Show>
			</h2>
			<div class="divide-y divide-outline">{props.children}</div>
		</section>
	);
}

const setStaticHidden = (hidden: boolean) => {
	for (const element of document.querySelectorAll<HTMLElement>("[data-center-static]")) element.hidden = hidden;
};

export default function LiveCenter(props: { lang?: Lang; code?: string; builtAt?: string }) {
	const route = props.code ? null : CENTER_PATH.exec(location.pathname);
	const fallback = !props.code;
	const code = props.code ?? route?.[2] ?? "";
	const lang: Lang = props.lang ?? (route?.[1] as Lang | undefined) ?? "ru";
	const t = messages(lang);

	const [card] = createResource(
		() => code || false,
		(value) => unwrap(api.GET("/centers/{code}", { params: { path: { code: value }, query: { lang } } })),
	);

	// `card()` бросает, если запрос упал: читаем только готовый ответ.
	const center = () => (card.state === "ready" ? (card()?.data ?? null) : null);
	const notFound = () => card.error instanceof ApiError && card.error.status === 404;
	// Собранная страница уступает карточке из API, только если та новее.
	const stale = () => {
		const updatedAt = center()?.updatedAt;
		if (fallback || !props.builtAt) return Boolean(center());
		return Boolean(updatedAt && Date.parse(updatedAt) > Date.parse(props.builtAt));
	};
	// Нет связи с API: на собранной странице остаётся она, на 404 - обычное «не найдено».
	const failed = () => Boolean(card.error) && !notFound();
	const shown = () => (fallback ? Boolean(code) && !failed() : !card.loading && (stale() || notFound()));

	createEffect(() => {
		setStaticHidden(shown());
		const name = center() && pickText(center()!.name);
		if (name && stale()) document.title = `${name} - tatarverse`;
	});

	return (
		<Show when={shown()}>
			<div class="mx-auto flex w-full max-w-5xl min-w-0 flex-col gap-10">
				<Show when={fallback}>
					<nav class="flex w-full flex-wrap items-center justify-between gap-3">
						<LinkButton href={paths.catalog(lang)} variant="outline" icon="arrow-left">
							{t("center.back")}
						</LinkButton>
						<Show when={center()}>
							<LinkButton href={paths.edit(lang, code)} variant="outline" icon="pencil">
								{t("center.suggest")}
							</LinkButton>
						</Show>
					</nav>
				</Show>

				<Switch>
					<Match when={notFound()}>
						<Empty title={t("center.notFound")} hint={t("center.notFoundHint")}>
							<LinkButton href={paths.catalog(lang)} variant="outline">
								{t("center.back")}
							</LinkButton>
						</Empty>
					</Match>
					<Match when={fallback && card.loading}>
						<Loading label={t("common.loading")} />
					</Match>
					<Match when={stale() && center()}>
						{(data) => <CenterView center={data()} lang={lang} />}
					</Match>
				</Switch>
			</div>
		</Show>
	);
}

function CenterView(props: { center: PublicCenterCard; lang: Lang }) {
	const t = messages(props.lang);
	const c = props.center;
	const name = pickText(c.name);
	const summary = pickText(c.summary);
	const about = pickText(c.about);
	const features = pickItems(c.features);
	const city = pickText(c.location?.city);
	const region = pickText(c.location?.region);
	const district = pickText(c.location?.district);
	const placeText = [city || region, c.location?.country].filter(Boolean).join(", ");
	const translationMissing = props.lang !== "ru" && textLang(c.name) === "ru";
	const facts: [string, string][] = [
		...((region ? [[t("form.region"), region]] : []) as [string, string][]),
		...((district ? [[t("form.district"), district]] : []) as [string, string][]),
		...((c.location?.federalDistrict ? [[t("form.federalDistrict"), c.location.federalDistrict]] : []) as [string, string][]),
		...((c.leader ? [[t("center.leader"), c.leader]] : []) as [string, string][]),
		...c.facts.map((fact) => [fact.label, fact.value] as [string, string]),
		...((c.pubDate ? [[t("center.published"), formatDate(c.pubDate, props.lang)]] : []) as [string, string][]),
		[t("center.updated"), formatDate(c.updatedAt, props.lang)],
	];
	const mapUrl = c.coordinates
		? `https://www.openstreetmap.org/?mlat=${num(c.coordinates.lat)}&mlon=${num(c.coordinates.lon)}#map=16/${num(c.coordinates.lat)}/${num(c.coordinates.lon)}`
		: null;
	const contactCount = c.links.length + c.phones.length + c.emails.length + (c.address ? 1 : 0);

	return (
		<article class="flex min-w-0 flex-col gap-10">
			<header class="flex w-full min-w-0 flex-col items-center gap-5 text-center">
				<p class="card-outline inline-flex max-w-full items-center gap-2 rounded-full bg-surface py-1.5 pr-4 pl-1.5 text-sm font-medium text-foreground">
					<span
						class="contents"
						innerHTML={`<center-avatar class="center-avatar size-7 shrink-0 [&_svg]:size-full">${centerAvatarMarkup(c.id)}</center-avatar>`}
					/>
					<Show when={c.location?.flag}>
						<span class="shrink-0 text-base leading-none">{c.location!.flag}</span>
					</Show>
					<span class="min-w-0 truncate">{placeText || t("center.online")}</span>
				</p>
				<h1 class="max-w-3xl text-balance break-words text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
					{name}
				</h1>
				<Show when={summary}>
					<p class="max-w-2xl text-balance text-base leading-7 text-muted-foreground sm:text-lg">{summary}</p>
				</Show>
				<p class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs font-medium text-subtle-foreground">
					<span>{c.category}</span>
					<span aria-hidden="true">·</span>
					<span>{c.type}</span>
				</p>
				<Show when={translationMissing}>
					<p class="text-xs text-subtle-foreground">{t("center.fallback")}</p>
				</Show>
			</header>

			<div class="grid min-w-0 grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2">
				<Show when={contactCount}>
					<Column title={t("center.contacts")} count={contactCount}>
						<For each={c.links}>
							{(link) => (
								<a href={link.url} target="_blank" rel="nofollow noreferrer noopener" class={rowClass}>
									<Icon name={linkIcons[link.kind ?? ""] ?? "world"} class="size-4.5 text-subtle-foreground" />
									<span class="min-w-0 flex-1 truncate font-medium">{display(link.url)}</span>
									<Icon name="arrow-up-right" class="text-subtle-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
								</a>
							)}
						</For>
						<For each={c.phones}>
							{(phone) => (
								<a href={`tel:${phone.replace(/[^\d+]/g, "")}`} class={rowClass}>
									<Icon name="phone" class="size-4.5 text-subtle-foreground" />
									<span class="min-w-0 flex-1 truncate font-medium">{phone}</span>
								</a>
							)}
						</For>
						<For each={c.emails}>
							{(email) => (
								<a href={`mailto:${email}`} class={rowClass}>
									<Icon name="mail" class="size-4.5 text-subtle-foreground" />
									<span class="min-w-0 flex-1 truncate font-medium">{email}</span>
								</a>
							)}
						</For>
						<Show when={c.address}>
							<Show
								when={mapUrl}
								fallback={
									<p class={rowClass}>
										<Icon name="map-pin" class="size-4.5 text-subtle-foreground" />
										<span class="min-w-0 flex-1">{c.address}</span>
									</p>
								}
							>
								<a href={mapUrl!} target="_blank" rel="noreferrer noopener" class={rowClass}>
									<Icon name="map-pin" class="size-4.5 text-subtle-foreground" />
									<span class="min-w-0 flex-1">{c.address}</span>
									<Icon name="arrow-up-right" class="text-subtle-foreground" />
								</a>
							</Show>
						</Show>
					</Column>
				</Show>

				<Column title={t("center.facts")}>
					<dl class="contents">
						<For each={facts}>
							{([label, value]) => (
								<div class={rowClass}>
									<dt class="shrink-0 text-muted-foreground">{label}</dt>
									<dd class="ml-auto min-w-0 truncate text-right font-medium">{value}</dd>
								</div>
							)}
						</For>
					</dl>
				</Column>
			</div>

			<div class="center-prose prose mx-auto w-full max-w-3xl min-w-0">
				<Show when={features.length}>
					<h2>{t("center.features")}</h2>
					<ul>
						<For each={features}>{(item) => <li>{item}</li>}</For>
					</ul>
				</Show>
				<Show when={about}>
					<h2>{t("center.about")}</h2>
					<For each={about.split(/\n{2,}/)}>{(paragraph) => <p class="whitespace-pre-line">{paragraph}</p>}</For>
				</Show>
				<Show when={c.sources.length}>
					<h2>{t("center.sources")}</h2>
					<ul>
						<For each={c.sources}>
							{(source) => (
								<li>
									<a href={source.url} target="_blank" rel="nofollow noreferrer noopener">
										{source.title || display(source.url)}
									</a>
								</li>
							)}
						</For>
					</ul>
				</Show>
			</div>
		</article>
	);
}
