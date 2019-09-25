"use strict";

(function () {
  function r(e, n, t) {
    function o(i, f) {
      if (!n[i]) {
        if (!e[i]) {
          var c = "function" == typeof require && require;if (!f && c) return c(i, !0);if (u) return u(i, !0);var a = new Error("Cannot find module '" + i + "'");throw a.code = "MODULE_NOT_FOUND", a;
        }var p = n[i] = { exports: {} };e[i][0].call(p.exports, function (r) {
          var n = e[i][1][r];return o(n || r);
        }, p, p.exports, r, e, n, t);
      }return n[i].exports;
    }for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) {
      o(t[i]);
    }return o;
  }return r;
})()({ 1: [function (require, module, exports) {
    /* globals self, caches, location, fetch */

    var staticCacheName = 'suave-static-v1';
    var allCaches = [staticCacheName];

    // on install event - store files in  cache
    self.addEventListener('install', function (event) {
      event.waitUntil(caches.open(staticCacheName).then(function (cache) {
        return cache.addAll(['index.html', 'bundle.js', 'main.css', 'https://fonts.gstatic.com/s/lato/v14/S6uyw4BMUTPHjxAwXjeu.woff2']);
      }));
    });

    // on activate event - delete old cache(s)
    self.addEventListener('activate', function (event) {
      event.waitUntil(caches.keys().then(function (cacheNames) {
        return Promise.all(cacheNames.filter(function (cacheName) {
          return cacheName.startsWith('suave-') && !allCaches.includes(cacheName);
        }).map(function (cacheName) {
          return caches['delete'](cacheName);
        }));
      }));
    });

    // on fetch event - return skeleton page if offline
    self.addEventListener('fetch', function (event) {
      var requestUrl = new URL(event.request.url);

      if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname === '/') {
          event.respondWith(caches.match('/'));
          return;
        }
      }
      event.respondWith(caches.match(event.request).then(function (response) {
        return response || fetch(event.request);
      }));
    });
  }, {}] }, {}, [1]);