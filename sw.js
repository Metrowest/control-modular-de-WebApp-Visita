// =========================================================================
// SW.JS (SERVICE WORKER CONSERVED - REGLAS DE RED NETWORK-FIRST EN VIVO)
// Ubicación del bloque: REEMPLAZO COMPLETO EN EL ARCHIVO SW.JS
// =========================================================================
const CACHE_NAME = 'v1_sheets_pwa';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './carpetas.js', /* Añadimos tu motor de Drive al almacenamiento base */
  './manifest.json'
];

// Instalación nativa y almacenamiento de la estructura visual base
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Forzamos al Service Worker a tomar el control de la red al instante
self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

// ESTRATEGIA DE RED DINÁMICA: Consulta internet primero para Sheets y Drive en tiempo real
self.addEventListener('fetch', e => {
  // COMPUERTA DE ESCAPE: Si la petición va hacia Google (Sheets o Drive), pasa directo sin tocar la caché
  if (e.request.url.includes("://google.com") || e.request.url.includes("google.com")) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Para los archivos locales del diseño, intenta internet primero; si no hay red, usa la caché
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Si la respuesta es válida, actualizamos la caché visual en segundo plano
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseToCache));
        }
        return response;
      })
      .catch(() => {
        // Si el usuario se queda sin internet, Firefox saca el diseño de la memoria
        return caches.match(e.request);
      })
  );
});
