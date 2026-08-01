const CACHE='atlas-ecosystem-v2';
const CORE=['./','index.html','commencer.html','parler-a-atlas.html','comprendre.html','apaiser.html','evoluer.html','ressources.html','relais-humain.html','professionnels.html','espace-personnel.html','confidentialite.html','aide-urgente.html','atlas-system.css','atlas-core.js','manifest.webmanifest','assets/atlas-logo-hero-transparent.png','assets/neural-bust-square.webp','assets/icon-192.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).pathname.startsWith('/api/'))return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(!response||response.status!==200||response.type==='opaque')return response;const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>event.request.mode==='navigate'?caches.match('index.html'):undefined)));
});
