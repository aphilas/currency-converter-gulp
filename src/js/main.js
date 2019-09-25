/* globals fetch */

const _idb = require('./lib/idb.js')
// _idb()

const _sw = require('./lib/reg_sw.js')
_sw()

const url = 'https://free.currencyconverterapi.com/api/v5/currencies'

let fromSelect = document.getElementById('fromSelect')
let toSelect = document.getElementById('toSelect')

let fromInput = document.getElementById('fromInput')
let toInput = document.getElementById('toInput')

function updateOutput (event) {
  if (isNaN(fromInput.value) || fromInput.value < 0) {
    toInput.value = 'Please enter a number greater than zero'
    toInput.style.fontSize = '1rem'
  }
  if (fromInput.value !== '') {
    convertFetch(fromSelect.value, toSelect.value, fromInput.value)
    toInput.style.fontSize = '2rem'
  }
}

function clearOutput (event) {
  let key = event.key
  if (key === 8 || key === 48 || fromInput.value === '') {
    toInput.value = ''
  }
}

;(function events () {
  fromInput.addEventListener('keyup', updateOutput)
  fromInput.addEventListener('keyup', clearOutput)
  fromSelect.addEventListener('change', updateOutput)
  toSelect.addEventListener('change', updateOutput)
})()

function fetchSelect () {
  fetch(url)
    .then(response => response.json())
    .then(data => {
      let currencies = data.results

      currencies = Object.values(currencies)
      currencies.sort((a, b) => {
        let textA = a.currencyName.toUpperCase()
        let textB = b.currencyName.toUpperCase()
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0
      })

      for (let el of currencies) {
        let currencyName = el.currencyName
        let currencyId = el.id

        let option = document.createElement('option')
        if (currencyName.length > 20) {
          currencyName = `${currencyName.substring(0, 19)} ...`
        }
        option.innerHTML = `${currencyName} (${currencyId})`
        option.value = currencyId

        var optionClone = option.cloneNode(true)

        fromSelect.appendChild(option)
        toSelect.appendChild(optionClone)
      }
    })
    .catch(err => console.log(err))
}

function convertFetch (from, to, amt) {
  let url = `https://free.currencyconverterapi.com/api/v5/convert?q=${from}_${to}`

  if (fetch(url)) {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        let conversion = data.results

        let value = conversion[Object.keys(conversion)].val

        let converted = amt * value
        converted = converted.toFixed(2)

        toInput.value = converted
      })
  } else {
    // let pairToConvert = `${from}_${to}`

    // dbPromise.then(function (db) {
    //   let tx = db.transaction('currencies', 'readwrite')
    //   let keyValStore = tx.objectStore('currencies')

    //   let result = keyValStore.get(pairToConvert)

    //   let value = result.value
    //   let converted = amt * value
    //   converted = converted.toFixed(2)

    //   toInput.value = converted
    //   return tx.complete
    // })
  }
}
