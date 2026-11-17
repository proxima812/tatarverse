export const blogFormats = ["post", "article", "guide"] as const;
export const blogCategories = ["communities", "language", "culture", "history"] as const;

// Иконки категорий в духе app-иконок: градиентная плашка, белый глиф.
export const blogCategoryStyles = {
	communities: { icon: "mdi:account-group", surface: "from-sky-400 to-blue-600" },
	language: { icon: "mdi:translate", surface: "from-violet-400 to-purple-700" },
	culture: { icon: "mdi:flower", surface: "from-amber-300 to-orange-500" },
	history: { icon: "mdi:book-open-page-variant", surface: "from-emerald-400 to-teal-600" },
} as const;
