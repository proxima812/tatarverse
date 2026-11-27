
export interface AccentPreset {
	value: string;
	labelKey: string;
	label: string;
	from: string;
	to: string;
}

// Порядок - по кругу оттенков: так ряд кружков в меню читается как радуга.
export const ACCENT_PRESETS: AccentPreset[] = [
	{ value: "default", labelKey: "accent.default", label: "Дефолт", from: "#29262C", to: "#5A575E" },
	{ value: "green", labelKey: "accent.green", label: "Җаным Яшел", from: "#3BB273", to: "#A3E4BC" },
	{ value: "teal", labelKey: "accent.teal", label: "Саф Фирүзә", from: "#14B8A6", to: "#8BE5D7" },
	{ value: "blue", labelKey: "accent.blue", label: "Кадерле Зәнгәр", from: "#4A8BF8", to: "#9CC0FF" },
	{ value: "violet", labelKey: "accent.violet", label: "Яна Шәмәха", from: "#8A4CF0", to: "#B48BF8" },
	{ value: "pink", labelKey: "accent.pink", label: "Иркә Алсу", from: "#FF3A8E", to: "#FF92B8" },
	{ value: "red", labelKey: "accent.red", label: "Утлы Кызыл", from: "#FF3B45", to: "#FF948C" },
	{ value: "orange", labelKey: "accent.orange", label: "Кояшлы Әфлисун", from: "#FF7A1A", to: "#FFB27A" },
	{ value: "amber", labelKey: "accent.amber", label: "Алтын Сары", from: "#F5A524", to: "#FCD38A" },
];

export const ACCENT_VALUES = ACCENT_PRESETS.map((preset) => preset.value);

export const DEFAULT_ACCENT = "default";
