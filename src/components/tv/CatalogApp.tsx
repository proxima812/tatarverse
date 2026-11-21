import { api, loadConfig, num, unwrap, type PublicCenterItem } from "@/lib/tvapi/client";
import { pickText } from "@/lib/tvapi/text";
import { createMemo, createResource, createSignal, For, Match, onCleanup, Show, Switch } from "solid-js";
import { errorText, messages, type Lang } from "./messages";
import { paths } from "./paths";
import { Button, CenterMark, Empty, Icon, inputClass, LinkButton, Loading, Notice, Select } from "./ui";

const PAGE = 24;

interface Filters {
	q: string;
	country: string;
	category: string;
	online: boolean;
}

function readFilters(): Filters {
	const params = new URLSearchParams(location.search);
	return {
		q: params.get("q") ?? "",
		country: params.get("country") ?? "",
		category: params.get("category") ?? "",
		online: params.get("online") === "true",
	};
}

/** Фильтры живут в адресе: ссылкой на подборку можно поделиться. */
function writeFilters(filters: Filters) {
	const params = new URLSearchParams();
	if (filters.q) params.set("q", filters.q);
	if (filters.country) params.set("country", filters.country);
	if (filters.category) params.set("category", filters.category);
	if (filters.online) params.set("online", "true");
	const query = params.toString();
	history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}`);
}

/** Каталог центров из api.tatarverse.cc: поиск, фильтры и карточки. */
export default function CatalogApp(props: { lang: Lang }) {
	const t = messages(props.lang);
	const [filters, setFilters] = createSignal<Filters>(readFilters());
	const [query, setQuery] = createSignal(filters().q);
	const [limit, setLimit] = createSignal(PAGE);

	// Поиск уходит на сервер не на каждую букву, а после паузы.
	let timer: ReturnType<typeof setTimeout> | undefined;
	const typeQuery = (value: string) => {
		setQuery(value);
		clearTimeout(timer);
		timer = setTimeout(() => update({ q: value.trim() }), 300);
	};
	onCleanup(() => clearTimeout(timer));

	const update = (patch: Partial<Filters>) => {
		const next = { ...filters(), ...patch };
		setFilters(next);
		setLimit(PAGE);
		writeFilters(next);
	};

	const [config] = createResource(loadConfig);
	const [countries] = createResource(() =>
		unwrap(api.GET("/countries", { params: { query: { lang: props.lang } } })),
	);
	const [list, { refetch }] = createResource(filters, (current) =>
		unwrap(
			api.GET("/centers", {
				params: {
					query: {
						lang: props.lang,
						q: current.q || undefined,
						country: current.country || undefined,
						category: current.category || undefined,
						online: current.online || undefined,
					},
				},
			}),
		),
	);

	const countryOptions = createMemo(() =>
		(countries()?.data ?? []).map((country) => ({
			value: country.code,
			label: `${country.flag ? `${country.flag} ` : ""}${country.name} (${num(country.count)})`,
		})),
	);
	const categoryOptions = createMemo(() =>
		(config()?.categories ?? []).map((category) => ({
			value: category.code,
			label: props.lang === "en" ? category.en : category.ru,
		})),
	);
	const filtered = () => {
		const current = filters();
		return Boolean(current.q || current.country || current.category || current.online);
	};

	return (
		<div class="flex min-w-0 flex-col gap-6">
			<div class="field-well flex min-w-0 flex-col gap-2 rounded-catalog corner-squircle p-2 md:flex-row md:items-center">
				<label class="relative min-w-0 flex-1">
					<span class="sr-only">{t("catalog.search")}</span>
					<Icon name="search" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle-foreground" />
					<input
						type="search"
						value={query()}
						onInput={(event) => typeQuery(event.currentTarget.value)}
						placeholder={t("catalog.search")}
						class={`${inputClass} pl-10`}
					/>
				</label>
				<Select
					class="md:w-56"
					aria-label={t("catalog.allCountries")}
					value={filters().country}
					placeholder={t("catalog.allCountries")}
					options={countryOptions()}
					onChange={(event) => update({ country: event.currentTarget.value })}
				/>
				<Select
					class="md:w-48"
					aria-label={t("catalog.allCategories")}
					value={filters().category}
					placeholder={t("catalog.allCategories")}
					options={categoryOptions()}
					onChange={(event) => update({ category: event.currentTarget.value })}
				/>
				<label class="inline-flex shrink-0 cursor-pointer items-center gap-2 px-2 text-sm text-muted-foreground">
					<input
						type="checkbox"
						checked={filters().online}
						onChange={(event) => update({ online: event.currentTarget.checked })}
						class="size-4 accent-(--color-accent)"
					/>
					{t("catalog.online")}
				</label>
			</div>

			<div class="flex flex-wrap items-center justify-between gap-3">
				<p class="text-sm tabular-nums text-subtle-foreground" role="status" aria-live="polite">
					<Show when={list()}>{t("catalog.found", { count: num(list()!.total) })}</Show>
				</p>
				<LinkButton href={paths.add(props.lang)} variant="outline" icon="plus">
					{t("catalog.add")}
				</LinkButton>
			</div>

			<Switch>
				<Match when={list.error}>
					<Notice tone="error">
						<p>{errorText(list.error, props.lang)}</p>
						<Button variant="outline" size="xs" class="mt-2" icon="refresh" onClick={() => refetch()}>
							{t("common.retry")}
						</Button>
					</Notice>
				</Match>
				<Match when={list.loading && !list.latest}>
					<Loading label={t("common.loading")} />
				</Match>
				<Match when={list.latest && list.latest.data.length === 0}>
					<Empty title={t("catalog.empty")} hint={t("catalog.emptyHint")}>
						<Show when={filtered()}>
							<Button variant="outline" onClick={() => { setQuery(""); update({ q: "", country: "", category: "", online: false }); }}>
								{t("catalog.reset")}
							</Button>
						</Show>
					</Empty>
				</Match>
				<Match when={list.latest}>
					<section
						class="grid min-w-0 grid-cols-1 gap-6 transition-opacity md:grid-cols-2"
						classList={{ "opacity-60": list.loading }}
					>
						<For each={list.latest!.data.slice(0, limit())}>
							{(center) => <CatalogCard center={center} lang={props.lang} />}
						</For>
					</section>
					<Show when={list.latest!.data.length > limit()}>
						<Button variant="outline" class="self-center" onClick={() => setLimit(limit() + PAGE)}>
							{t("catalog.showMore")}
						</Button>
					</Show>
				</Match>
			</Switch>
		</div>
	);
}

/** Карточка в стиле статического каталога (`catalog-card` из card.css). */
function CatalogCard(props: { center: PublicCenterItem; lang: Lang }) {
	const t = messages(props.lang);
	const name = () => pickText(props.center.name);
	const summary = () => pickText(props.center.summary);
	const place = () => {
		const location = props.center.location;
		return {
			flag: location?.flag ?? "",
			city: pickText(location?.city) || pickText(location?.region),
			country: location?.country ?? "",
		};
	};

	return (
		<article class="catalog-card group">
			<Show when={place().city || place().country}>
				<p class="catalog-card-location">
					<Show when={place().flag}>
						<span class="catalog-card-flag">{place().flag}</span>
					</Show>
					<Show when={place().city}>
						<span>{place().city}</span>
					</Show>
					<Show when={place().city && place().country}>
						<span aria-hidden="true">&#10625;</span>
					</Show>
					<Show when={place().country}>
						<span>{place().country}</span>
					</Show>
				</p>
			</Show>
			<div class="catalog-card-title-row">
				<CenterMark code={props.center.id} logo={props.center.logo} class="catalog-card-mark" />
				<h2 class="catalog-card-heading">
					<a href={paths.center(props.lang, props.center.id)} class="catalog-card-link">
						{name()}
					</a>
				</h2>
			</div>
			<Show when={summary()}>
				<p class="catalog-card-summary">{summary()}</p>
			</Show>
			<div class="catalog-card-meta">
				<div class="flex min-w-0 flex-1 flex-wrap gap-x-3 gap-y-1.5">
					<span class="catalog-card-chip">
						<Icon name="users" class="size-3.5" />
						<span>{props.center.category}</span>
					</span>
					<span class="catalog-card-chip">
						<Icon name="world" class="size-3.5" />
						<span>{props.center.type}</span>
					</span>
				</div>
				<span class="catalog-card-more" aria-hidden="true">
					<span>{t("catalog.more")}</span>
					<Icon name="arrow-up-right" />
				</span>
			</div>
		</article>
	);
}
