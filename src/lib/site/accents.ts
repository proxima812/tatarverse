
export interface AccentPreset {
	value: string;
	labelKey: string;
	label: string;
	from: string;
	to: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
	{ value: "default", labelKey: "accent.default", label: "Дефолт", from: "#29262C", to: "#4A474D" },
	{ value: "green", labelKey: "accent.green", label: "Җаным Яшел", from: "#1C9A57", to: "#8EDBAA" },
	{ value: "blue", labelKey: "accent.blue", label: "Кадерле Зәнгәр", from: "#4A8BF8", to: "#9CC0FF" },
	{ value: "violet", labelKey: "accent.violet", label: "Яна Шәмәха", from: "#8A4CF0", to: "#B48BF8" },
	{ value: "red", labelKey: "accent.red", label: "Утлы Кызыл", from: "#FF3B45", to: "#FF948C" },
	{ value: "pink", labelKey: "accent.pink", label: "Иркә Алсу", from: "#FF3A8E", to: "#FF92B8" },
];

export const ACCENT_VALUES = ACCENT_PRESETS.map((preset) => preset.value);

export const DEFAULT_ACCENT = "default";
