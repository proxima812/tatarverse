import type { AppLocale, Translate } from "@/i18n";
import { centerBody, centerData, centerLang } from "@/lib/center/apiCard";
import { completenessOf, type CenterCompleteness } from "@/lib/center/completeness";
import { centerDescription } from "@/lib/center/description";
import { centerJsonLd } from "@/lib/center/jsonLd";
import { getCenterLinkRows, getCenterLinks, type CenterLinkRow } from "@/lib/center/links";
import type { CenterLinkItem } from "@/lib/center/catalogMeta";
import type { PublicCenterCard } from "@/lib/tvapi/client";

/**
 * Всё, что странице центра нужно, - из карточки API (`GET /centers/{code}`), без коллекций сборки:
 * страница рендерится по запросу, поэтому новый и поправленный центр виден сразу. Поля берутся тем же
 * правилом, что и frontmatter выгрузки (`centerData`), а ссылки и полнота считаются по тому же тексту
 * (`centerBody`) - собранная из mdx и отрендеренная по запросу страницы не расходятся.
 */

export interface CenterFact {
	label: string;
	value: string;
}

export type RelatedCenter = CenterLinkItem;

export interface CenterDetail {
	title: string;
	summary: string | null;
	/** Категория и тип - надзаголовочная строка. */
	badges: string[];
	/** Место для плашки над заголовком: флаг, город, страна на языке страницы. */
	place: { flag: string | null; city: string | null; country: string | null };
	/** Все ссылки раздела «Ссылки» - колонка страницы показывает их вместо раздела. */
	linkRows: CenterLinkRow[];
	facts: CenterFact[];
	sourceUrl: string | null;
	sourceLabel: string | null;
	/** Полнота карточки - по русской карточке, общая для обеих локалей. */
	completeness: CenterCompleteness;
	description: string;
	publishedDate?: Date;
	modifiedDate?: Date;
	related: RelatedCenter[];
	relatedTitle: string;
	jsonLd: ReturnType<typeof centerJsonLd>;
}

const validDate = (value?: string | null) => {
	if (!value) return undefined;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date;
};

/** Домен источника: в боковой колонке он читается лучше полного URL. */
const hostnameOf = (url: string) => {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return url;
	}
};

/** Полнота - по русской карточке на любом языке страницы: разделы и пороги в правилах русские. */
function completeness(ruCard: PublicCenterCard) {
	const data = centerData(ruCard, "ru");
	return completenessOf({
		body: centerBody(ruCard, "ru"),
		source: data.source,
		city: data.location.city,
		region: data.location.region,
		online: data.type === "Онлайн",
	});
}

export function cardDetail(
	card: PublicCenterCard,
	{
		locale,
		t,
		canonicalURL,
		related,
		ruCard,
	}: { locale: AppLocale; t: Translate; canonicalURL: string; related: RelatedCenter[]; ruCard: PublicCenterCard },
): CenterDetail {
	const lang = centerLang(locale);
	const data = centerData(card, lang);
	const title = data.title || t("detail.fallbackTitle");
	const summary = data.summary ?? null;
	// Страна и флаг - уже на языке страницы из API.
	const country = card.location?.country?.trim() || null;
	const flag = card.location?.flag?.trim() || null;
	const city = data.location.city ?? null;
	const region = data.location.region ?? null;
	// В сведениях - страна без флага (флаг стоит в плашке над заголовком), как у собранной страницы.
	const placeLine = country ?? "";
	const published = validDate(data.pubDate);
	const formattedDate = published?.toLocaleDateString(locale, {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "Asia/Almaty",
	});

	const body = centerBody(card, lang);
	const facts = [
		placeLine ? { label: t("detail.country"), value: placeLine } : null,
		city ? { label: t("detail.city"), value: city } : null,
		region ? { label: t("detail.region"), value: region } : null,
		formattedDate ? { label: t("content.published"), value: formattedDate } : null,
	].filter((fact): fact is CenterFact => Boolean(fact));

	return {
		title,
		summary,
		badges: [data.category, data.type].filter((value): value is string => Boolean(value)),
		place: { flag, city, country },
		linkRows: getCenterLinkRows(body),
		facts,
		sourceUrl: data.source ?? null,
		sourceLabel: data.source ? hostnameOf(data.source) : null,
		completeness: completeness(ruCard),
		description: centerDescription(
			{ title, summary, city, region, country, category: data.category ?? null, type: data.type ?? null },
			locale,
		),
		publishedDate: published,
		modifiedDate: validDate(data.updatedAt),
		related,
		relatedTitle: card.location?.countryCode
			? t("detail.related", { country: country ?? "" })
			: t("detail.relatedCategory"),
		jsonLd: centerJsonLd({
			name: title,
			description: summary,
			// Сайт организации из «Ссылок»; source - это справочник или статья.
			url: getCenterLinks(body, data.source).find((link) => link.kind === "website")?.href ?? canonicalURL,
			country,
			region,
			city,
		}),
	};
}
