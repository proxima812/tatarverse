import { getLocalePathname } from "@/i18n";

export function isActiveRoute(pathname: string, href: string): boolean {
 const page = `/${getLocalePathname(pathname)}`.replace(/\/+$/, "") || "/";
 const target = href.replace(/\/+$/, "") || "/";
 return target === "/" ? page === "/" : page === target || page.startsWith(`${target}/`);
}
