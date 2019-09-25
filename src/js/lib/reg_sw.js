module.exports = () => {
  if (!navigator.serviceWorker) return
  navigator.serviceWorker.register('js/sw-bundle.min.js').then(function (reg) {
    if (!navigator.serviceWorker.controller) {
      return
    }

    if (reg.waiting) {
      console.log('service worker waiting')
      return
    }

    if (reg.installing) {
      console.log('service worker installing')
      return
    }

    reg.addEventListener('updatefound', function () {
      console.log('service worker updated')
    })
  })

  // Ensure refresh is only called once.
  // This works around a bug in "force update on reload".
  let refreshing
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (refreshing) return
    window.location.reload()
    refreshing = true
  })
}
