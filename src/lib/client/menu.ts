document.querySelectorAll<HTMLElement>("[data-menu]").forEach((root) => {
		const toggle = root.querySelector<HTMLButtonElement>("[data-menu-toggle]");
		const list = root.querySelector<HTMLElement>("[data-menu-list]");
		const backdrop = root.querySelector<HTMLElement>("[data-menu-backdrop]");
		const closeButton = root.querySelector<HTMLButtonElement>("[data-menu-close]");

		if (!toggle || !list || !backdrop) return;

		document.body.append(backdrop, list);

		let lockedScrollY = 0;

		const lockBody = () => {
			lockedScrollY = window.scrollY;
			document.documentElement.classList.add("overflow-hidden");
			document.body.classList.add("overflow-hidden", "touch-none");
			document.body.style.position = "fixed";
			document.body.style.top = `-${lockedScrollY}px`;
			document.body.style.left = "0";
			document.body.style.right = "0";
			document.body.style.width = "100%";
		};

		const unlockBody = () => {
			document.documentElement.classList.remove("overflow-hidden");
			document.body.classList.remove("overflow-hidden", "touch-none");
			document.body.style.position = "";
			document.body.style.top = "";
			document.body.style.left = "";
			document.body.style.right = "";
			document.body.style.width = "";
			window.scrollTo({ top: lockedScrollY, behavior: "instant" });
		};

		const FOCUSABLE =
			'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

		const getFocusable = (): HTMLElement[] =>
			Array.from(list.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
				(el) => el.offsetParent !== null,
			);

		const backgroundRegions = (): HTMLElement[] =>
			Array.from(document.body.children).filter(
				(el): el is HTMLElement =>
					el instanceof HTMLElement && el !== list && el !== backdrop,
			);

		const setOpen = (isOpen: boolean) => {
			const wasOpen = toggle.getAttribute("aria-expanded") === "true";
			if (isOpen === wasOpen) return;

			toggle.setAttribute("aria-expanded", String(isOpen));

			for (const el of [list, backdrop]) {
				el.dataset.state = isOpen ? "open" : "closed";
				el.classList.toggle("pointer-events-auto", isOpen);
				el.classList.toggle("pointer-events-none", !isOpen);
			}

			for (const region of backgroundRegions()) {
				region.inert = isOpen;
			}

			if (isOpen) {
				list.classList.remove("translate-x-full");
				backdrop.classList.remove("opacity-0");
				lockBody();
				getFocusable()[0]?.focus();
			} else {
				unlockBody();
				if (list.contains(document.activeElement)) {
					toggle.focus();
				}
			}
		};

		const onAnimationEnd = (event: AnimationEvent) => {
			const el = event.currentTarget as HTMLElement;

			if (el.dataset.state !== "closed") return;

			if (el === list) {
				list.classList.add("translate-x-full");
			} else {
				backdrop.classList.add("opacity-0");
			}
		};

		list.addEventListener("animationend", onAnimationEnd);
		backdrop.addEventListener("animationend", onAnimationEnd);

		toggle.addEventListener("click", () => {
			setOpen(toggle.getAttribute("aria-expanded") !== "true");
		});

		list.addEventListener("click", (event) => {
			if (event.target instanceof Element && event.target.closest("a")) {
				setOpen(false);
			}
		});

		backdrop.addEventListener("click", () => {
			setOpen(false);
		});

		closeButton?.addEventListener("click", () => {
			setOpen(false);
			toggle.focus();
		});

		list.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				setOpen(false);
				toggle.focus();

				return;
			}

			if (event.key !== "Tab") return;

			const focusable = getFocusable();

			if (focusable.length === 0) return;

			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			} else if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			}
		});
	});
