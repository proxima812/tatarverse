import { buttonClass, type ButtonSize, type ButtonVariant } from "@/lib/button";
import { cn } from "@/lib/cn";
import { For, Show, splitProps, type JSX, type ParentProps } from "solid-js";
import { icons, type IconName } from "./icons";

/**
 * Общие кусочки островов на Solid. Классы те же, что у Astro-компонентов
 * сайта (`buttonClass`, токены цветов и радиусов), - чтобы формы и админка
 * не выглядели отдельным приложением.
 */

export function Icon(props: { name: IconName; class?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			class={cn("size-4 shrink-0", props.class)}
			aria-hidden="true"
			innerHTML={icons[props.name]}
		/>
	);
}

type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
	icon?: IconName;
	busy?: boolean;
};

export function Button(props: ButtonProps) {
	const [local, rest] = splitProps(props, ["variant", "size", "icon", "busy", "class", "children", "type"]);
	return (
		<button
			type={local.type ?? "button"}
			class={buttonClass({
				variant: local.variant,
				size: local.size,
				className: local.class,
				extra: ["cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"],
			})}
			disabled={local.busy || rest.disabled}
			{...rest}
		>
			<Show when={local.busy} fallback={local.icon && <Icon name={local.icon} />}>
				<Icon name="loader-2" class="animate-spin" />
			</Show>
			<span>{local.children}</span>
		</button>
	);
}

export function LinkButton(
	props: JSX.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant; size?: ButtonSize; icon?: IconName },
) {
	const [local, rest] = splitProps(props, ["variant", "size", "icon", "class", "children"]);
	return (
		<a class={buttonClass({ variant: local.variant, size: local.size, className: cn("no-underline", local.class) })} {...rest}>
			{local.icon && <Icon name={local.icon} />}
			<span>{local.children}</span>
		</a>
	);
}

export const inputClass =
	"w-full min-w-0 rounded-control corner-squircle bg-surface px-3.5 py-2 text-sm text-surface-foreground ring ring-inset ring-outline outline-none transition placeholder:text-subtle-foreground hover:ring-outline-strong focus-visible:ring-2 focus-visible:ring-accent aria-invalid:ring-2 aria-invalid:ring-destructive disabled:opacity-60";

export const selectClass = cn(inputClass, "cursor-pointer appearance-none pr-9");

/**
 * Подпись, подсказка, поле и ошибка - одна разметка на все поля форм.
 * Подсказка стоит под подписью, до поля: читается сверху вниз, не нужно
 * возвращаться взглядом под поле, чтобы понять, что в него писать.
 */
export function Field(
	props: ParentProps<{ label: JSX.Element; hint?: JSX.Element; error?: string; class?: string; optional?: string }>,
) {
	return (
		<label class={cn("flex min-w-0 flex-col gap-2", props.class)}>
			<FieldHead label={props.label} hint={props.hint} optional={props.optional} />
			{props.children}
			<FieldError error={props.error} />
		</label>
	);
}

export function FieldHead(props: { label: JSX.Element; hint?: JSX.Element; optional?: string }) {
	return (
		<span class="flex flex-col gap-0.5">
			<span class="text-sm font-medium text-foreground">
				{props.label}
				<Show when={props.optional}>
					<span class="ml-1.5 font-normal text-subtle-foreground">· {props.optional}</span>
				</Show>
			</span>
			<Show when={props.hint}>
				<span class="text-[0.8125rem] leading-5 text-subtle-foreground">{props.hint}</span>
			</Show>
		</span>
	);
}

export function FieldError(props: { error?: string }) {
	return (
		<Show when={props.error}>
			<span class="text-xs text-destructive" role="alert">
				{props.error}
			</span>
		</Show>
	);
}

export function SelectArrow() {
	return (
		<svg
			viewBox="0 0 20 20"
			class="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-subtle-foreground"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"
		>
			<path d="m5 7 5 5 5-5" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	);
}

export function Select(
	props: JSX.SelectHTMLAttributes<HTMLSelectElement> & {
		options: { value: string; label: string }[];
		placeholder?: string;
	},
) {
	const [local, rest] = splitProps(props, ["options", "placeholder", "class"]);
	return (
		<span class={cn("relative block min-w-0", local.class)}>
			<select class={selectClass} {...rest}>
				<Show when={local.placeholder !== undefined}>
					<option value="">{local.placeholder}</option>
				</Show>
				<For each={local.options}>
					{(option) => (
						<option value={option.value} selected={option.value === rest.value}>
							{option.label}
						</option>
					)}
				</For>
			</select>
			<SelectArrow />
		</span>
	);
}

export function Card(props: ParentProps<{ class?: string }>) {
	return (
		<section class={cn("rounded-card corner-squircle bg-surface card-outline p-5 text-surface-foreground sm:p-6", props.class)}>
			{props.children}
		</section>
	);
}

export function Notice(props: ParentProps<{ tone?: "info" | "error" | "success"; class?: string }>) {
	const tone = () =>
		props.tone === "error"
			? "bg-destructive/10 text-destructive"
			: props.tone === "success"
				? "bg-accent-soft text-accent-soft-foreground"
				: "bg-muted text-muted-foreground";
	return (
		<div class={cn("flex items-start gap-2 rounded-control corner-squircle px-4 py-3 text-sm leading-6", tone(), props.class)} role={props.tone === "error" ? "alert" : "status"}>
			<Icon
				name={props.tone === "error" ? "alert-triangle" : props.tone === "success" ? "circle-check" : "info-circle"}
				class="mt-1"
			/>
			<div class="min-w-0 flex-1">{props.children}</div>
		</div>
	);
}

export function Loading(props: { label: string }) {
	return (
		<p class="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground" role="status">
			<Icon name="loader-2" class="animate-spin" />
			{props.label}
		</p>
	);
}

export function Empty(props: ParentProps<{ icon?: IconName; title: string; hint?: string }>) {
	return (
		<section class="flex min-w-0 flex-col items-center gap-4 rounded-catalog corner-squircle bg-surface card-outline px-6 py-16 text-center text-surface-foreground">
			<Icon name={props.icon ?? "search"} class="size-8 text-subtle-foreground" />
			<p class="text-lg font-semibold">{props.title}</p>
			<Show when={props.hint}>
				<p class="max-w-md text-sm leading-6 text-muted-foreground">{props.hint}</p>
			</Show>
			{props.children}
		</section>
	);
}
