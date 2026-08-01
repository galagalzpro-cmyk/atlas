const CACHE='atlas-ecosystem-v1';
const CORE=['./','index.html','commencer.html','comprendre.html','apaiser.html','relais-humain.html','atlas-system.css','atlas-core.js','manifest.webmanifest','assets/hero-2k.webp','assets/neural-bust-square.webp','assets/atlas-logo-hero-transparent.png','assets/icon-192.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match('index.html'))))});
