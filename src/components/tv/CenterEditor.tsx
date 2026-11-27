import { getCountryLabel } from "@/data/worldCountries";
import type { PublicConfig } from "@/lib/tvapi/client";
import { num } from "@/lib/tvapi/client";
import { createMemo, For, Index, Show, type JSX } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { fieldError, listErrors, type CenterDraft, type TextField } from "./centerDraft";
import type { Lang, T } from "./messages";
import { Button, Field, FieldError, FieldHead, Icon, inputClass, Select } from "./ui";

interface Props {
	draft: CenterDraft;
	setDraft: SetStoreFunction<CenterDraft>;
	config: PublicConfig;
	/** Языки многоязычных полей в форме. */
	langs: string[];
	/** Язык подписей. */
	lang: Lang;
	t: T;
	errors: Record<string, string>;
}

export function Section(props: { title: string; children: JSX.Element }) {
	return (
		<fieldset class="flex min-w-0 flex-col gap-6 rounded-card corner-squircle bg-surface card-outline p-5 text-surface-foreground sm:p-7">
			<legend class="float-left w-full text-lg font-semibold tracking-tight text-foreground">{props.title}</legend>
			{props.children}
		</fieldset>
	);
}

/** Поля карточки центра - общие для публичной формы и модерации. */
export default function CenterEditor(props: Props) {
	const t = props.t;
	const limits = () => props.config.limits;
	const multi = () => props.langs.length > 1;

	const countries = createMemo(() => {
		// API знает русские и английские названия; татарские берём из своего справочника.
		const label = (country: PublicConfig["countries"][number]) =>
			props.lang === "en" ? country.en : props.lang === "tt" ? getCountryLabel(country.ru, "tt") : country.ru;
		return [...props.config.countries]
			.sort((a, b) => (a.code === "RU" ? -1 : b.code === "RU" ? 1 : label(a).localeCompare(label(b), props.lang)))
			.map((country) => ({ value: country.code, label: `${country.flag ? `${country.flag} ` : ""}${label(country)}` }));
	});
	const categories = () =>
		props.config.categories.map((category) => ({ value: category.code, label: props.lang === "en" ? category.en : category.ru }));

	/** Текстовое поле по языкам: в публичной форме один язык, в модерации все. */
	const LocalizedInput = (field: { key: TextField; label: string; hint?: string; max?: number; area?: boolean; optional?: boolean }) => (
		<For each={props.langs}>
			{(code) => (
				<Field
					label={multi() ? `${field.label} · ${code.toUpperCase()}` : field.label}
					hint={field.hint}
					optional={field.optional ? t("common.optional") : undefined}
					error={fieldError(props.errors, `${field.key}.${code}`, field.key)}
				>
					<Show
						when={field.area}
						fallback={
							<input
								class={inputClass}
								value={props.draft.text[field.key][code] ?? ""}
								maxLength={field.max}
								lang={code}
								aria-invalid={Boolean(fieldError(props.errors, `${field.key}.${code}`, field.key))}
								onInput={(event) => props.setDraft("text", field.key, code, event.currentTarget.value)}
							/>
						}
					>
						<textarea
							class={`${inputClass} min-h-32 leading-6`}
							value={props.draft.text[field.key][code] ?? ""}
							maxLength={field.max}
							lang={code}
							rows={6}
							onInput={(event) => props.setDraft("text", field.key, code, event.currentTarget.value)}
						/>
					</Show>
				</Field>
			)}
		</For>
	);

	return (
		<>
			<Section title={t("form.section.main")}>
				{LocalizedInput({ key: "name", label: t("form.name"), max: num(limits().nameMax) })}
				<Field label={t("form.category")} error={fieldError(props.errors, "category")}>
					<Select
						value={props.draft.category}
						placeholder={t("form.categoryPick")}
						options={categories()}
						aria-invalid={Boolean(fieldError(props.errors, "category"))}
						onChange={(event) => props.setDraft("category", event.currentTarget.value)}
					/>
				</Field>
				{LocalizedInput({ key: "summary", label: t("form.summary"), hint: t("form.summaryHint"), max: num(limits().summaryMax), optional: true })}
				{LocalizedInput({ key: "about", label: t("form.about"), hint: t("form.aboutHint"), max: num(limits().aboutMax), area: true, optional: true })}
			</Section>

			<Section title={t("form.section.place")}>
				<label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
					<input
						type="checkbox"
						class="size-4 accent-(--color-accent)"
						checked={props.draft.online}
						onChange={(event) => props.setDraft("online", event.currentTarget.checked)}
					/>
					{t("form.online")}
				</label>
				<div class="grid min-w-0 gap-6 sm:grid-cols-2">
					<Field
						label={t("form.country")}
						optional={props.draft.online ? t("common.optional") : undefined}
						error={fieldError(props.errors, "country")}
					>
						<Select
							value={props.draft.country}
							placeholder={t("form.countryPick")}
							options={countries()}
							aria-invalid={Boolean(fieldError(props.errors, "country"))}
							onChange={(event) => props.setDraft("country", event.currentTarget.value)}
						/>
					</Field>
					<Show when={props.draft.country === "RU"}>
						<Field label={t("form.federalDistrict")} optional={t("common.optional")} error={fieldError(props.errors, "federalDistrict")}>
							<Select
								value={props.draft.federalDistrict}
								placeholder="-"
								options={props.config.federalDistricts.map((district) => ({ value: district, label: district }))}
								onChange={(event) => props.setDraft("federalDistrict", event.currentTarget.value)}
							/>
						</Field>
					</Show>
				</div>
				<div class="flex min-w-0 flex-col gap-6">
					{LocalizedInput({ key: "region", label: t("form.region"), max: num(limits().placeMax), optional: true })}
					{LocalizedInput({ key: "city", label: t("form.city"), max: num(limits().placeMax), optional: true })}
					{LocalizedInput({ key: "district", label: t("form.district"), max: num(limits().placeMax), optional: true })}
				</div>
				<Field label={t("form.address")} optional={t("common.optional")} error={fieldError(props.errors, "address")}>
					<input
						class={inputClass}
						value={props.draft.address}
						maxLength={num(limits().addressMax)}
						onInput={(event) => props.setDraft("address", event.currentTarget.value)}
					/>
				</Field>
			</Section>

			<Section title={t("form.section.contacts")}>
				<StringList
					label={t("form.links")}
					hint={t("form.linksHint")}
					type="url"
					placeholder={t("form.linkPlaceholder")}
					values={props.draft.links}
					max={num(limits().linksMax)}
					error={listErrors(props.errors, "links")}
					onChange={(values) => props.setDraft("links", values)}
					t={t}
				/>
				<StringList
					label={t("form.phones")}
					type="tel"
					placeholder={t("form.phonePlaceholder")}
					values={props.draft.phones}
					max={num(limits().phonesMax)}
					error={listErrors(props.errors, "phones")}
					onChange={(values) => props.setDraft("phones", values)}
					t={t}
				/>
				<StringList
					label={t("form.emails")}
					type="email"
					placeholder="info@example.org"
					values={props.draft.emails}
					max={num(limits().emailsMax)}
					error={listErrors(props.errors, "emails")}
					onChange={(values) => props.setDraft("emails", values)}
					t={t}
				/>
				<Field label={t("form.leader")} optional={t("common.optional")} error={fieldError(props.errors, "leader")}>
					<input
						class={inputClass}
						value={props.draft.leader}
						maxLength={num(limits().leaderMax)}
						onInput={(event) => props.setDraft("leader", event.currentTarget.value)}
					/>
				</Field>
			</Section>

			<Section title={t("form.section.more")}>
				<For each={props.langs}>
					{(code) => (
						<StringList
							label={multi() ? `${t("form.features")} · ${code.toUpperCase()}` : t("form.features")}
							hint={t("form.featuresHint")}
							values={props.draft.features[code] ?? []}
							max={num(limits().featuresMax)}
							maxLength={num(limits().featureMax)}
							error={listErrors(props.errors, `features.${code}`) ?? listErrors(props.errors, "features")}
							onChange={(values) => props.setDraft("features", code, values)}
							t={t}
						/>
					)}
				</For>
				<PairList
					label={t("form.facts")}
					hint={t("form.factsHint")}
					items={props.draft.facts.map((fact) => [fact.label, fact.value] as [string, string])}
					placeholders={[t("form.factLabel"), t("form.factValue")]}
					max={num(limits().factsMax)}
					error={listErrors(props.errors, "facts")}
					onChange={(items) => props.setDraft("facts", items.map(([label, value]) => ({ label, value })))}
					t={t}
				/>
				<PairList
					label={t("form.sources")}
					hint={t("form.sourcesHint")}
					items={props.draft.sources.map((item) => [item.url, item.title] as [string, string])}
					placeholders={["https://", t("form.sourceTitle")]}
					max={num(limits().sourcesMax)}
					error={listErrors(props.errors, "sources")}
					onChange={(items) => props.setDraft("sources", items.map(([url, title]) => ({ url, title })))}
					t={t}
				/>
			</Section>
		</>
	);
}

function ListShell(props: {
	label: string;
	hint?: string;
	error?: string;
	canAdd: boolean;
	onAdd: () => void;
	t: T;
	children: JSX.Element;
}) {
	return (
		<div class="flex min-w-0 flex-col gap-2" role="group" aria-label={props.label}>
			{/* Все списки карточки необязательные. */}
			<FieldHead label={props.label} hint={props.hint} optional={props.t("common.optional")} />
			<div class="flex min-w-0 flex-col gap-2">{props.children}</div>
			<FieldError error={props.error} />
			<Show when={props.canAdd}>
				<Button variant="ghost" size="xs" icon="plus" class="self-start hover:text-foreground" onClick={props.onAdd}>
					{props.t("common.add")}
				</Button>
			</Show>
		</div>
	);
}

function RemoveButton(props: { onClick: () => void; t: T }) {
	return (
		<button
			type="button"
			class="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-subtle-foreground transition hover:bg-muted hover:text-destructive"
			aria-label={props.t("common.remove")}
			onClick={props.onClick}
		>
			<Icon name="x" />
		</button>
	);
}

/** Список строк: ссылки, телефоны, особенности. Пустая строка всегда одна в конце. */
function StringList(props: {
	label: string;
	hint?: string;
	values: string[];
	max: number;
	maxLength?: number;
	type?: string;
	placeholder?: string;
	error?: string;
	onChange: (values: string[]) => void;
	t: T;
}) {
	const rows = () => (props.values.length ? props.values : [""]);
	const set = (index: number, value: string) => {
		const next = [...rows()];
		next[index] = value;
		props.onChange(next);
	};
	return (
		<ListShell
			label={props.label}
			hint={props.hint}
			error={props.error}
			canAdd={rows().length < props.max && rows().at(-1)?.trim() !== ""}
			onAdd={() => props.onChange([...rows(), ""])}
			t={props.t}
		>
			<Index each={rows()}>
				{(value, index) => (
					<div class="flex min-w-0 items-center gap-1">
						<input
							class={inputClass}
							type={props.type ?? "text"}
							value={value()}
							placeholder={props.placeholder}
							maxLength={props.maxLength}
							aria-label={props.label}
							onInput={(event) => set(index, event.currentTarget.value)}
						/>
						<Show when={rows().length > 1 || value()}>
							<RemoveButton t={props.t} onClick={() => props.onChange(rows().filter((_, i) => i !== index))} />
						</Show>
					</div>
				)}
			</Index>
		</ListShell>
	);
}

/** Список пар: «Прочее» (подпись - значение) и источники (адрес - подпись). */
function PairList(props: {
	label: string;
	hint?: string;
	items: [string, string][];
	placeholders: [string, string];
	max: number;
	error?: string;
	onChange: (items: [string, string][]) => void;
	t: T;
}) {
	const rows = () => (props.items.length ? props.items : [["", ""] as [string, string]]);
	const set = (index: number, part: 0 | 1, value: string) => {
		const next = rows().map((row) => [...row] as [string, string]);
		next[index][part] = value;
		props.onChange(next);
	};
	return (
		<ListShell
			label={props.label}
			hint={props.hint}
			error={props.error}
			canAdd={rows().length < props.max && Boolean(rows().at(-1)?.join("").trim())}
			onAdd={() => props.onChange([...rows(), ["", ""]])}
			t={props.t}
		>
			<Index each={rows()}>
				{(row, index) => (
					<div class="flex min-w-0 items-center gap-1">
						<div class="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
							<input
								class={inputClass}
								value={row()[0]}
								placeholder={props.placeholders[0]}
								aria-label={props.placeholders[0]}
								onInput={(event) => set(index, 0, event.currentTarget.value)}
							/>
							<input
								class={inputClass}
								value={row()[1]}
								placeholder={props.placeholders[1]}
								aria-label={props.placeholders[1]}
								onInput={(event) => set(index, 1, event.currentTarget.value)}
							/>
						</div>
						<Show when={rows().length > 1 || row().join("")}>
							<RemoveButton t={props.t} onClick={() => props.onChange(rows().filter((_, i) => i !== index))} />
						</Show>
					</div>
				)}
			</Index>
		</ListShell>
	);
}
