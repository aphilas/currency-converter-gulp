/* globals self, caches, location, fetch */

let staticCacheName = 'suave-static-v1'
let allCaches = [staticCacheName]

// on install event - store files in  cache
self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(staticCacheName).then(function (cache) {
    return cache.addAll(['index.html', 'bundle.js', 'main.css',
      'https://fonts.gstatic.com/s/lato/v14/S6uyw4BMUTPHjxAwXjeu.woff2'])
  }))
})

// on activate event - delete old cache(s)
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (cacheNames) {
    return Promise.all(cacheNames.filter(function (cacheName) {
      return cacheName.startsWith('suave-') && !allCaches.includes(cacheName)
    }).map(function (cacheName) {
      return caches['delete'](cacheName)
    }))
  }))
})

// on fetch event - return skeleton page if offline
self.addEventListener('fetch', function (event) {
  var requestUrl = new URL(event.request.url)

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/'))
      return
    }
  }
  event.respondWith(caches.match(event.request).then(function (response) {
    return response || fetch(event.request)
  }))
})
