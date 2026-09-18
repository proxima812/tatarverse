import { cn } from "@/lib/cn";

/**
 * Единственный источник правды по форме кнопок.
 *
 * Стили живут здесь, а не в компонентах: `ButtonLink` (ссылка) и `Button`
 * (действие) собираются из одного набора, поэтому кнопка выглядит одинаково
 * везде — главная, каталог, печать, формы. Новая кнопка берётся отсюда;
 * собственный список классов на `<a>`/`<button>` в разметке — регресс.
 */
export type ButtonVariant =
	| "default"
	| "gradient"
	| "outline"
	| "surface"
	| "ghost"
	| "disabled";

export type ButtonSize = "default" | "xs";

export const buttonBaseClass =
	"inline-flex shrink-0 max-w-fit items-center gap-1.5 rounded-control corner-squircle font-medium transition";

export const buttonVariants: Record<ButtonVariant, string> = {
	default: "bg-primary text-primary-foreground hover:bg-primary/80",
	gradient: "btn-gradient text-accent-foreground",
	outline: "bg-transparent text-primary/80 ring ring-primary/10 ring-inset hover:bg-primary/5",
	surface: "bg-surface text-foreground surface-lift hover:bg-surface-muted",
	ghost: "bg-transparent text-muted-foreground",
	disabled: "bg-transparent text-muted-foreground",
};

export const buttonSizes: Record<ButtonSize, string> = {
	default: "px-4 py-2 text-sm",
	xs: "px-2 py-1 text-xs sm:px-3 sm:py-1.5",
};

export function buttonClass({
	variant = "default",
	size = "default",
	className,
	extra,
}: {
	variant?: ButtonVariant;
	size?: ButtonSize;
	className?: unknown;
	extra?: unknown;
} = {}) {
	return cn(
		buttonBaseClass,
		buttonVariants[variant] ?? buttonVariants.default,
		buttonSizes[size] ?? buttonSizes.default,
		extra,
		className,
	);
}
