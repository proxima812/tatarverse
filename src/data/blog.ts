export const blogFormats = ["post", "article", "guide"] as const;
export const blogCategories = ["communities", "language", "culture", "history"] as const;

export const blogCategoryStyles = {
	communities: { icon: "mdi:account-group", surface: "from-sky-300 via-sky-500 to-blue-700" },
	language: { icon: "mdi:translate", surface: "from-violet-300 via-violet-500 to-purple-800" },
	culture: { icon: "mdi:flower", surface: "from-amber-200 via-orange-400 to-orange-600" },
	history: { icon: "mdi:book-open-page-variant", surface: "from-emerald-200 via-emerald-500 to-teal-700" },
} as const;
