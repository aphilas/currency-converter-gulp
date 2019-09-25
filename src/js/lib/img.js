module.exports = (url) => {
  return new Promise((resolve, reject) => {
    let img = new Image()
    img.src = url

    img.onload = () => {resolve(img)}
    img.onerror = (err) => {reject(err)}
  })
}