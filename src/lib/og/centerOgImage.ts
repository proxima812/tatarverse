import { readFile } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";
import tabler from "@iconify-json/tabler/icons.json" with { type: "json" };
import satori from "satori";

/**
 * OG-картинка карточки центра 1200×630: лого, заголовок до трёх строк,
 * внизу место и категории. Рисуется один раз при сборке - на Cloudflare
 * уходит готовый PNG, функций и лимитов Workers нет.
 */

const COLOR = "#333333";
const fontFile = (subset: string, weight: number) =>
	readFile(`node_modules/@fontsource/onest/files/onest-${subset}-${weight}-normal.woff`);

let fontsPromise: Promise<Buffer[]> | null = null;
let logoPromise: Promise<string> | null = null;

// Кириллица и латиница лежат в разных файлах: без latin пропадают «» и цифры.
const loadFonts = () =>
	(fontsPromise ??= Promise.all(
		["cyrillic", "latin"].flatMap((subset) => [fontFile(subset, 400), fontFile(subset, 700)]),
	));
const loadLogo = () =>
	(logoPromise ??= readFile("public/flower.svg", "utf8").then(
		(svg) => `data:image/svg+xml;base64,${Buffer.from(svg.replaceAll("black", COLOR)).toString("base64")}`,
	));

const iconSrc = (name: string) => {
	const icon = (tabler.icons as Record<string, { body: string }>)[name.replace("tabler:", "")];
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" color="${COLOR}">${icon.body}</svg>`;
	return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({
	type,
	props: { style, children },
});

const meta = (icon: string, text: string) =>
	el("div", { display: "flex", alignItems: "center", gap: 12 }, [
		{ type: "img", props: { src: iconSrc(icon), width: 32, height: 32 } },
		el("div", { display: "flex" }, text),
	]);

export interface CenterOgData {
	title: string;
	place: string | null;
	tags: string[];
}

export async function renderCenterOgImage({ title, place, tags }: CenterOgData): Promise<Buffer> {
	const [cyrRegular, cyrBold, latRegular, latBold] = await loadFonts();
	const logo = await loadLogo();

	const tree = el(
		"div",
		{
			// satori прибавляет padding к размеру: 1000 + 2×100 = 1200.
			width: 1000,
			height: 430,
			padding: 100,
			display: "flex",
			flexDirection: "column",
			justifyContent: "space-between",
			backgroundColor: "#ffffff",
			color: COLOR,
			fontFamily: "Onest, Onest Latin",
		},
		[
			el("div", { display: "flex", flexDirection: "column", gap: 40, width: 1000 }, [
				{ type: "img", props: { src: logo, width: 50, height: 55 } },
				el(
					"div",
					{
						display: "block",
						width: 1000,
						fontSize: 52,
						fontWeight: 700,
						lineHeight: 1.2,
						letterSpacing: "-0.01em",
						lineClamp: 3,
					},
					title,
				),
			]),
			el("div", { display: "flex", flexWrap: "wrap", rowGap: 16, columnGap: 40, width: 1000, fontSize: 28 }, [
				place ? meta("tabler:map-pin", place) : null,
				tags.length ? meta("tabler:tag", tags.join(" · ")) : null,
			].filter(Boolean)),
		],
	);

	const svg = await satori(tree as never, {
		width: 1200,
		height: 630,
		fonts: [
			{ name: "Onest", data: cyrRegular, weight: 400, style: "normal" },
			{ name: "Onest", data: cyrBold, weight: 700, style: "normal" },
			{ name: "Onest Latin", data: latRegular, weight: 400, style: "normal" },
			{ name: "Onest Latin", data: latBold, weight: 700, style: "normal" },
		],
	});

	// Текст satori уже перевёл в контуры: системные шрифты resvg не нужны,
	// а их сканирование стоит ~1.5 с на картинку.
	return new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng();
}
