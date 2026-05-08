import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const CENTER_CATEGORIES = [
	"Татарский",
	"Татаро-Башкирский",
	"Башкирский",
	"Крымотатарский",
] as const;

const CENTER_TYPES = ["Регион РФ", "Зарубежный", "Онлайн"] as const;

const CenterCategorySchema = z.enum(CENTER_CATEGORIES);
const CenterTypeSchema = z.enum(CENTER_TYPES);

const CenterLocationSchema = z
	.object({
		flag: z.string().optional(),
		city: z.string().optional(),
		country: z.string().optional(),
		region: z.string().optional(),
	})
	.strict();

const CenterSchema = z
	.object({
		title: z.string().min(1),
		pubDate: z.string().optional(),
		type: CenterTypeSchema.optional(),
		category: CenterCategorySchema.optional(),
		source: z.string().url().optional(),
		summary: z.string().optional(),
		location: CenterLocationSchema.optional(),
	})
	.strict();

const centers = defineCollection({
	loader: glob({
		pattern: "**/*.{md,mdx}",
		base: "./src/data/centers_formatted",
	}),
	schema: CenterSchema,
});

export const collections = {
	centers,
};

export type CenterCategory = z.infer<typeof CenterCategorySchema>;
export type CenterType = z.infer<typeof CenterTypeSchema>;
export type CenterLocation = z.infer<typeof CenterLocationSchema>;
export type CenterData = z.infer<typeof CenterSchema>;
