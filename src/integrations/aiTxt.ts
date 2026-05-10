import type { APIRoute } from "astro";
import type { AstroIntegration } from "astro";
import { fileURLToPath } from "node:url";
import { config } from "../../main.config";

export interface AiTxtOptions {
	enabled?: boolean;
	aiAccess?: "allowed" | "disallowed";
	siteName?: string;
	description?: string;
	locale?: string;
	policy?: string[];
}

let _options: AiTxtOptions = {};

const getAiTxt = (site: URL) => {
	const siteName = _options.siteName ?? config.site.OG.site_name;
	const siteDescription = _options.description ?? config.site.OG.description;
	const locale = _options.locale ?? config.site.OG.locale;
	const aiAccess = _options.aiAccess ?? "allowed";
	const policy = _options.policy ?? [
		"- Public pages may be accessed and indexed.",
		"- Public content may be summarized with attribution.",
		"- Prefer canonical URLs when referencing pages.",
		"- Do not imply authorship, endorsement, or partnership.",
		"- Do not present transformed content as the official source.",
	];

	return [
		`Site: ${siteName}`,
		`URL: ${site.href}`,
		`Description: ${siteDescription}`,
		`Language: ${locale}`,
		"",
		`AI-Access: ${aiAccess}`,
		"AI-Policy:",
		...policy,
		"",
		`LLMs: ${new URL("llms.txt", site).href}`,
		`Sitemap: ${new URL("sitemap-index.xml", site).href}`,
	].join("\n");
};

export const GET: APIRoute = ({ site }) => {
	return new Response(getAiTxt(site ?? new URL(config.site.url)), {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
};

export default function aiTxt(options: AiTxtOptions = {}): AstroIntegration {
	return {
		name: "ai-txt",
		hooks: {
			"astro:config:setup": ({ injectRoute }) => {
				if (options.enabled === false) return;
				_options = options;
				injectRoute({
					pattern: "/ai.txt",
					entrypoint: fileURLToPath(new URL("./aiTxt.ts", import.meta.url)),
				});
			},
		},
	};
}
