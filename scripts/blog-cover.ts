// Обложки блога в стиле heroui.com/blog: светлый фон, пунктирные фигуры, бледные иконки,
// в центре логотип и рисунок по теме материала.
// Запуск: bun scripts/blog-cover.ts [id] - без id пересобирает все обложки из covers.
// В frontmatter: cover: /images/blog/<id>.svg
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

type Cover = {
	// Иконки mdi для фона, по смыслу материала.
	scatter: string[];
	// Рисунок справа от логотипа: SVG-разметка в поле 120×120.
	art: string;
};

const ink = "#2E2E2F";

const covers: Record<string, Cover> = {
	default: {
		scatter: ["book-open-page-variant-outline", "translate", "account-group-outline", "map-marker-outline", "flower-outline", "earth"],
		art: `<g fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
			<path d="M20 34c14-6 28-6 40 4c12-10 26-10 40-4v56c-14-6-28-6-40 4c-12-10-26-10-40-4z"/>
			<path d="M60 38v56"/>
		</g>`,
	},
	"tatary-v-italii": {
		scatter: ["airplane", "map-marker-outline", "mosque-outline", "translate", "account-group-outline", "pizza", "passport", "coffee-outline"],
		// Колизей: три яруса арок, снизу полоска итальянского флага.
		art: `<g fill="none" stroke="${ink}" stroke-width="4" stroke-linejoin="round">
			<path d="M14 92V40q46-16 92 0v52z"/>
			<path d="M14 58h92M14 75h92"/>
			<path d="M26 52h68" stroke-dasharray="4 8" stroke-linecap="round"/>
			${[0, 1, 2, 3].map((i) => {
				const x = 25 + i * 20;
				return `<path d="M${x} 75v-6a5 5 0 0 1 10 0v6M${x} 92v-8a5 5 0 0 1 10 0v8"/>`;
			}).join("")}
		</g>
		<g transform="translate(36 102)">
			<rect width="16" height="8" rx="2" fill="#1F9D55"/>
			<rect x="16" width="16" height="8" fill="#FFFFFF" stroke="#E4E4E7"/>
			<rect x="32" width="16" height="8" rx="2" fill="#D93A3A"/>
		</g>`,
	},
};

const W = 1112;
const H = 560;
const mdi = JSON.parse(readFileSync("node_modules/@iconify-json/mdi/icons.json", "utf8")).icons as Record<string, { body: string }>;
const logo = readFileSync("public/favicon.svg", "utf8").match(/<path[\s\S]*<\/path>|<path[^>]*\/>/g)!.join("");

// Места для фоновых иконок: по краям, чтобы не спорить с центром.
const spots = [[96, 420], [210, 120], [880, 96], [990, 300], [860, 460], [130, 260], [700, 70], [380, 470]];

function render({ scatter, art }: Cover) {
	const icons = scatter.slice(0, spots.length).map((name, i) => {
		const [x, y] = spots[i];
		return `<g transform="translate(${x} ${y}) scale(1.5)" color="#C4C4C8" fill="#C4C4C8">${mdi[name].body}</g>`;
	}).join("");
	const tile = (x: number, inner: string) => `<g transform="translate(${x} 200)">
		<rect width="160" height="160" rx="44" fill="#FFFFFF" filter="url(#shadow)"/>
		${inner}
	</g>`;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
	<defs>
		<filter id="shadow" x="-30%" y="-30%" width="160%" height="170%">
			<feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#18181B" flood-opacity="0.08"/>
			<feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#18181B" flood-opacity="0.06"/>
		</filter>
	</defs>
	<rect width="${W}" height="${H}" fill="#F4F4F5"/>
	<g fill="none" stroke="#D4D4D8" stroke-width="2" stroke-dasharray="8 8">
		<path d="M-40 150 L120 -10 Q140 -30 160 -10 L190 20 Q210 40 190 60 L60 190 Q40 210 20 190 Z"/>
		<path d="M150 -20 V260 Q150 290 130 310 L60 380"/>
		<path d="M1150 330 L990 490 Q970 510 990 530 L1040 580"/>
		<path d="M960 600 V420 Q960 390 990 370 L1150 260"/>
	</g>
	${icons}
	<path d="M${W / 2 - 52} 280 H${W / 2 + 52}" stroke="#C4C4C8" stroke-width="2" stroke-dasharray="6 6"/>
	<circle cx="${W / 2}" cy="280" r="14" fill="#FFFFFF" stroke="#D4D4D8" stroke-width="2"/>
	<path d="M${W / 2 - 5} 280 H${W / 2 + 5} M${W / 2} 275 V285" stroke="#8E8E93" stroke-width="2" stroke-linecap="round"/>
	${tile(W / 2 - 52 - 160, `<g transform="translate(24 24) scale(0.21875)">${logo}</g>`)}
	${tile(W / 2 + 52, `<g transform="translate(20 20)">${art}</g>`)}
</svg>
`;
}

mkdirSync("public/images/blog", { recursive: true });
const ids = process.argv[2] ? [process.argv[2]] : Object.keys(covers);
for (const id of ids) {
	const svg = `public/images/blog/${id}.svg`;
	writeFileSync(svg, render(covers[id]));
	// PNG для og:image: соцсети не показывают SVG-превью. Нужен rsvg-convert (brew install librsvg).
	Bun.spawnSync(["rsvg-convert", svg, "-o", svg.replace(/\.svg$/, ".png")]);
	console.log(svg);
}
