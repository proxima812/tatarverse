import { config } from "../../main.config.ts";

export const includeAssets = [
	"favicon.svg",
	"favicon.ico",
	"favicon-16x16.png",
	"favicon-32x32.png",
	"favicon-48x48.png",
	"apple-touch-icon.png",
	"mstile-150x150.png",
];

export const workbox = {
	clientsClaim: true,
	skipWaiting: true,
	cleanupOutdatedCaches: true,
	globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,avif,woff2}"],
};

export const manifest = {
	name: config.site.OG.title,
	short_name: "tatarverse",
	description: config.site.description,
	theme_color: "#080214",
	background_color: "#fafafa",
	display: "standalone",
	orientation: "portrait",
	start_url: "/",
	scope: "/",
	icons: [
		{
			src: "/android-chrome-192x192.png",
			sizes: "192x192",
			type: "image/png",
		},
		{
			src: "/android-chrome-512x512.png",
			sizes: "512x512",
			type: "image/png",
		},
		{
			src: "/icon-72x72.png",
			sizes: "72x72",
			type: "image/png",
		},
		{
			src: "/icon-96x96.png",
			sizes: "96x96",
			type: "image/png",
		},
		{
			src: "/icon-128x128.png",
			sizes: "128x128",
			type: "image/png",
		},
		{
			src: "/icon-144x144.png",
			sizes: "144x144",
			type: "image/png",
		},
		{
			src: "/icon-152x152.png",
			sizes: "152x152",
			type: "image/png",
		},
		{
			src: "/icon-167x167.png",
			sizes: "167x167",
			type: "image/png",
		},
		{
			src: "/apple-touch-icon.png",
			sizes: "180x180",
			type: "image/png",
		},
		{
			src: "/icon-256x256.png",
			sizes: "256x256",
			type: "image/png",
		},
		{
			src: "/icon-384x384.png",
			sizes: "384x384",
			type: "image/png",
		},
		{
			src: "/android-chrome-512x512.png",
			sizes: "512x512",
			type: "image/png",
		},
	],
};
