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
			source: z.url().optional(),
		summary: z.string().optional(),
		location: CenterLocationSchema.optional(),
	})
	.strict();

const PostSchema = z
	.object({
		title: z.string().min(1),
		description: z.string().min(1),
		pubDate: z.coerce.date(),
		author: z.string().min(1),
		tags: z.array(z.string()).default([]),
		category: z.string().min(1),
		ogImage: z.string().optional(),
	})
	.strict()
	.transform((data) => ({
		...data,
		publishedDate: data.pubDate,
	}));

const centers = defineCollection({
	loader: glob({
		pattern: "**/*.{md,mdx}",
		base: "./src/data/centers_formatted",
	}),
	schema: CenterSchema,
});

const centersEn = defineCollection({
	loader: glob({
		pattern: "**/*.{md,mdx}",
		base: "./src/data/centers_i18n/en",
	}),
	schema: CenterSchema,
});

const posts = defineCollection({
	loader: glob({
		pattern: "**/*.{md,mdx}",
		base: "./src/data/posts",
	}),
	schema: PostSchema,
});

export const collections = {
	centers,
	centersEn,
	posts,
};

export type CenterCategory = z.infer<typeof CenterCategorySchema>;
export type CenterType = z.infer<typeof CenterTypeSchema>;
export type CenterLocation = z.infer<typeof CenterLocationSchema>;
export type CenterData = z.infer<typeof CenterSchema>;
export type PostData = z.infer<typeof PostSchema>;
