const CACHE = 'traza-v1'

// Archivos del shell de la app — se cargan aunque no haya internet
const SHELL = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

// Instalar: cachear el shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

// Activar: limpiar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Fetch: network-first para APIs y Supabase, cache-first para assets estáticos
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Siempre red para: APIs, Supabase, autenticación
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('posthog') ||
    url.hostname.includes('sentry') ||
    e.request.method !== 'GET'
  ) {
    return // sin interceptar → va directo a red
  }

  // Para el resto: intentar red, caer en cache si no hay conexión
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request))
  )
})
