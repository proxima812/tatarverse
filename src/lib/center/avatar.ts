// The Astro adapter uses Blobatar's adapter interface; keep the dependency pinned.
import { _parts, serializeVars } from "blobatar/internal";

/** A center keeps the same face in both locales and in client-rendered cards. */
export function centerAvatarMarkup(id: string): string {
 const parts = _parts(`tatarverse-${id}`, { animate: "always" });
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="36" height="36" aria-hidden="true" style="${serializeVars(parts.vars ?? {})}"><g class="${parts.cls}">${parts.inner}</g></svg>`;
}
