const root = document.querySelector<HTMLElement>("[data-blog]");

if (root) {
	const entries = [...root.querySelectorAll<HTMLElement>("[data-blog-entry]")];
	const categories = [...root.querySelectorAll<HTMLButtonElement>("[data-blog-category]")];
	const formats = [...root.querySelectorAll<HTMLButtonElement>("[data-blog-format]")];
	const search = root.querySelector<HTMLInputElement>("[data-blog-search]")!;
	const count = root.querySelector<HTMLElement>("[data-blog-count]")!;
	const empty = root.querySelector<HTMLElement>("[data-blog-empty]")!;
	const title = root.querySelector<HTMLElement>("[data-empty-title]")!;
	const description = root.querySelector<HTMLElement>("[data-empty-description]")!;
	const reset = root.querySelector<HTMLButtonElement>("[data-blog-reset]")!;
	let category = "";
	let format = "all";
	const normalize = (value: string) => value.toLocaleLowerCase().replaceAll("ё", "е").trim();

	function update() {
		const query = normalize(search.value);
		let visible = 0;
		for (const entry of entries) {
			const matches = (!category || entry.dataset.category === category)
				&& (format === "all" || entry.dataset.format === format)
				&& normalize(entry.dataset.search ?? "").includes(query);
			entry.hidden = !matches;
			if (matches) visible++;
		}
		for (const button of categories) button.setAttribute("aria-pressed", String(button.dataset.blogCategory === category));
		for (const button of formats) button.setAttribute("aria-pressed", String(button.dataset.blogFormat === format));
		count.textContent = count.dataset.template!.replace("{count}", String(visible));
		empty.hidden = visible > 0;
		const filtered = Boolean(category || format !== "all" || query);
		title.textContent = filtered ? title.dataset.filtered! : title.dataset.default!;
		description.textContent = filtered ? description.dataset.filtered! : description.dataset.default!;
		reset.hidden = !filtered;
	}

	for (const button of categories) button.addEventListener("click", () => {
		category = category === button.dataset.blogCategory ? "" : button.dataset.blogCategory!;
		update();
	});
	for (const button of formats) button.addEventListener("click", () => {
		format = button.dataset.blogFormat!;
		update();
	});
	search.addEventListener("input", update);
	reset.addEventListener("click", () => {
		category = "";
		format = "all";
		search.value = "";
		update();
	});
}
