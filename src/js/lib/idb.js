module.exports = () => {
  const idb = require('idb')

  let dbPromise = idb.open('test-db', 1, function (upgradeDb) {
    switch (upgradeDb.oldVersion) {
      case 0:
        upgradeDb.createObjectStore('currencies', { keyPath: 'pair' })
    }
  })

  ;(function () {
    function fetchAndStoreCurrencies () {
      const url = 'https://free.currencyconverterapi.com/api/v5/currencies'
      window.fetch(url)
        .then(response => response.json())
        .then(data => {
          let currencies = data.results
          return currencies
        })
        .then(currencies => {
          let currenciesArray = Object.values(currencies)
          let currenciesIds = []
          for (let currency of currenciesArray) {
            currenciesIds.push(currency.id)
          }

          return currenciesIds
        }).then(currenciesIds => {
          let pairs = []

          for (let i = 0; i < currenciesIds.length - 1; i++) {
            for (let j = i + 1; j < currenciesIds.length; j++) {
              pairs.push(`${currenciesIds[i]}_${currenciesIds[j]}`)
            }
          }

          return pairs
        }).then(pairs => {
          for (let i = 0; i < pairs.length; i++) {
            let url = `https://free.currencyconverterapi.com/api/v5/convert?q=${pairs[i]}`
            window.fetch(url)
              .then(response => response.json())
              .then(res => {
                let val = res.results
                val = Object.values(val)[0].val
                let valObj = {
                  pair: pairs[i],
                  value: val
                }
                console.log(valObj)
                return valObj
              })
              .then(valObj => {
                dbPromise.then(function (db) {
                  let tx = db.transaction('currencies', 'readwrite')
                  let keyValStore = tx.objectStore('currencies')
                  keyValStore.put(valObj)
                  return tx.complete
                })
              })
          }
        })
    }

    fetchAndStoreCurrencies()
  })()
}
