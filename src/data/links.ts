type Link = {
	label: string;
	labelKey: string;
	icon?: string;
	class: string;
	href: string;
	size: "default";
	variant: "default" | "outline" | "disabled" | "ghost";
	target?: "_blank";
};

export const links: Link[] = [
	{
		label: "Перейти к центрам",
		labelKey: "nav.toCenters",
		icon: "mdi:account-group",
		class: "sm:px-4 sm:py-2 py-1.5 px-3 text-sm ",
		href: "/centers",
		size: "default",
		variant: "default",
	},
	{
		label: "Статистика",
		labelKey: "nav.stats",
		icon: "mdi:chart-box-outline",
		class: "sm:px-4 sm:py-2 py-1.5 px-3 text-sm",
		href: "/stats",
		size: "default",
		variant: "outline",
	},
	{
		label: "Блог",
		labelKey: "nav.blog",
		icon: "mdi:book-open-page-variant",
		class: "sm:px-4 sm:py-2 py-1.5 px-3 text-sm",
		href: "/blog",
		size: "default",
		variant: "outline",
	},
	{
		label: "Переводы",
		labelKey: "nav.translations",
		icon: "mdi:translate",
		class: "sm:px-4 sm:py-2 py-1.5 px-3 text-sm ",
		href: "/translations",
		size: "default",
		variant: "outline",
	},
	{
		label: "Источники",
		labelKey: "nav.sources",

		class: "sm:px-4 sm:py-2 py-1.5 px-3 text-sm",
		href: "/sources",
		size: "default",
		variant: "outline",
	},
	{
		label: "Политика",
		labelKey: "nav.policy",
		class: "sm:px-4 sm:py-2 py-1.5 px-3 text-sm",
		href: "/policy",
		size: "default",
		variant: "outline",
	},
];
