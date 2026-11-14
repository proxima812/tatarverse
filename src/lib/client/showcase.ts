/**
 * Запуск анимаций в макетах главной (`components/home/showcase`).
 *
 * `data-armed` ставит сцену в начальный кадр (анимации на паузе в 0%),
 * `data-play` их пускает. Без этого скрипта и при reduced motion сцена
 * остаётся в финальном кадре, который нарисован без анимаций вовсе.
 */

let observer: IntersectionObserver | undefined;

export function initShowcases() {
	if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

	observer ??= new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				const scene = entry.target as HTMLElement;
				if (entry.isIntersecting) {
					scene.setAttribute("data-play", "");
					if (scene.hasAttribute("data-once")) observer?.unobserve(scene);
				} else {
					scene.removeAttribute("data-play");
				}
			}
		},
		{ threshold: 0.45 },
	);

	for (const scene of document.querySelectorAll<HTMLElement>("[data-showcase]:not([data-armed])")) {
		scene.setAttribute("data-armed", "");
		observer.observe(scene);
	}
}
