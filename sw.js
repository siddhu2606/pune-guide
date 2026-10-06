// Offline cache: app files, plus map tiles cached as she browses them.
// Network-first for app files so updates show up; falls back to cache when offline.
const CACHE = "pune-guide-v4";
const FILES = ["./", "index.html", "style.css", "app.js", "spots.js", "manifest.json", "icons/icon.svg", "lib/leaflet.js", "lib/leaflet.css"];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => clients.claim())));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request)));
});
