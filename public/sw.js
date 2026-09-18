// Minimal service worker for PWA installability.
// Strategy: network-first with offline fallback for navigations;
// no caching of API or auth requests to avoid stale session data.

const CACHE_NAME = "mailflare-shell-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll([OFFLINE_URL]))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
			)
			.then(() => self.clients.claim()),
	);
});

self.addEventListener("fetch", (event) => {
	const request = event.request;
	if (request.method !== "GET") return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;
	// Never cache API calls, auth, or realtime endpoints.
	if (url.pathname.startsWith("/api/") || url.pathname === "/api/realtime") return;

	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request).catch(() =>
				caches.match(OFFLINE_URL).then((response) => response || new Response("Offline", { status: 503 })),
			),
		);
		return;
	}

	// Cache-first for static assets (_next/static, icons).
	if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
		event.respondWith(
			caches.match(request).then(
				(cached) =>
					cached ||
					fetch(request).then((response) => {
						if (response.ok) {
							const clone = response.clone();
							caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
						}
						return response;
					}),
			),
		);
	}
});
