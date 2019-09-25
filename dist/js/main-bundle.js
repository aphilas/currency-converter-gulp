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
    'use strict';

    (function () {
      function toArray(arr) {
        return Array.prototype.slice.call(arr);
      }

      function promisifyRequest(request) {
        return new Promise(function (resolve, reject) {
          request.onsuccess = function () {
            resolve(request.result);
          };

          request.onerror = function () {
            reject(request.error);
          };
        });
      }

      function promisifyRequestCall(obj, method, args) {
        var request;
        var p = new Promise(function (resolve, reject) {
          request = obj[method].apply(obj, args);
          promisifyRequest(request).then(resolve, reject);
        });

        p.request = request;
        return p;
      }

      function promisifyCursorRequestCall(obj, method, args) {
        var p = promisifyRequestCall(obj, method, args);
        return p.then(function (value) {
          if (!value) return;
          return new Cursor(value, p.request);
        });
      }

      function proxyProperties(ProxyClass, targetProp, properties) {
        properties.forEach(function (prop) {
          Object.defineProperty(ProxyClass.prototype, prop, {
            get: function get() {
              return this[targetProp][prop];
            },
            set: function set(val) {
              this[targetProp][prop] = val;
            }
          });
        });
      }

      function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
        properties.forEach(function (prop) {
          if (!(prop in Constructor.prototype)) return;
          ProxyClass.prototype[prop] = function () {
            return promisifyRequestCall(this[targetProp], prop, arguments);
          };
        });
      }

      function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
        properties.forEach(function (prop) {
          if (!(prop in Constructor.prototype)) return;
          ProxyClass.prototype[prop] = function () {
            return this[targetProp][prop].apply(this[targetProp], arguments);
          };
        });
      }

      function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
        properties.forEach(function (prop) {
          if (!(prop in Constructor.prototype)) return;
          ProxyClass.prototype[prop] = function () {
            return promisifyCursorRequestCall(this[targetProp], prop, arguments);
          };
        });
      }

      function Index(index) {
        this._index = index;
      }

      proxyProperties(Index, '_index', ['name', 'keyPath', 'multiEntry', 'unique']);

      proxyRequestMethods(Index, '_index', IDBIndex, ['get', 'getKey', 'getAll', 'getAllKeys', 'count']);

      proxyCursorRequestMethods(Index, '_index', IDBIndex, ['openCursor', 'openKeyCursor']);

      function Cursor(cursor, request) {
        this._cursor = cursor;
        this._request = request;
      }

      proxyProperties(Cursor, '_cursor', ['direction', 'key', 'primaryKey', 'value']);

      proxyRequestMethods(Cursor, '_cursor', IDBCursor, ['update', 'delete']);

      // proxy 'next' methods
      ['advance', 'continue', 'continuePrimaryKey'].forEach(function (methodName) {
        if (!(methodName in IDBCursor.prototype)) return;
        Cursor.prototype[methodName] = function () {
          var cursor = this;
          var args = arguments;
          return Promise.resolve().then(function () {
            cursor._cursor[methodName].apply(cursor._cursor, args);
            return promisifyRequest(cursor._request).then(function (value) {
              if (!value) return;
              return new Cursor(value, cursor._request);
            });
          });
        };
      });

      function ObjectStore(store) {
        this._store = store;
      }

      ObjectStore.prototype.createIndex = function () {
        return new Index(this._store.createIndex.apply(this._store, arguments));
      };

      ObjectStore.prototype.index = function () {
        return new Index(this._store.index.apply(this._store, arguments));
      };

      proxyProperties(ObjectStore, '_store', ['name', 'keyPath', 'indexNames', 'autoIncrement']);

      proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, ['put', 'add', 'delete', 'clear', 'get', 'getAll', 'getKey', 'getAllKeys', 'count']);

      proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, ['openCursor', 'openKeyCursor']);

      proxyMethods(ObjectStore, '_store', IDBObjectStore, ['deleteIndex']);

      function Transaction(idbTransaction) {
        this._tx = idbTransaction;
        this.complete = new Promise(function (resolve, reject) {
          idbTransaction.oncomplete = function () {
            resolve();
          };
          idbTransaction.onerror = function () {
            reject(idbTransaction.error);
          };
          idbTransaction.onabort = function () {
            reject(idbTransaction.error);
          };
        });
      }

      Transaction.prototype.objectStore = function () {
        return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
      };

      proxyProperties(Transaction, '_tx', ['objectStoreNames', 'mode']);

      proxyMethods(Transaction, '_tx', IDBTransaction, ['abort']);

      function UpgradeDB(db, oldVersion, transaction) {
        this._db = db;
        this.oldVersion = oldVersion;
        this.transaction = new Transaction(transaction);
      }

      UpgradeDB.prototype.createObjectStore = function () {
        return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
      };

      proxyProperties(UpgradeDB, '_db', ['name', 'version', 'objectStoreNames']);

      proxyMethods(UpgradeDB, '_db', IDBDatabase, ['deleteObjectStore', 'close']);

      function DB(db) {
        this._db = db;
      }

      DB.prototype.transaction = function () {
        return new Transaction(this._db.transaction.apply(this._db, arguments));
      };

      proxyProperties(DB, '_db', ['name', 'version', 'objectStoreNames']);

      proxyMethods(DB, '_db', IDBDatabase, ['close']);

      // Add cursor iterators
      // TODO: remove this once browsers do the right thing with promises
      ['openCursor', 'openKeyCursor'].forEach(function (funcName) {
        [ObjectStore, Index].forEach(function (Constructor) {
          // Don't create iterateKeyCursor if openKeyCursor doesn't exist.
          if (!(funcName in Constructor.prototype)) return;

          Constructor.prototype[funcName.replace('open', 'iterate')] = function () {
            var args = toArray(arguments);
            var callback = args[args.length - 1];
            var nativeObject = this._store || this._index;
            var request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
            request.onsuccess = function () {
              callback(request.result);
            };
          };
        });
      });

      // polyfill getAll
      [Index, ObjectStore].forEach(function (Constructor) {
        if (Constructor.prototype.getAll) return;
        Constructor.prototype.getAll = function (query, count) {
          var instance = this;
          var items = [];

          return new Promise(function (resolve) {
            instance.iterateCursor(query, function (cursor) {
              if (!cursor) {
                resolve(items);
                return;
              }
              items.push(cursor.value);

              if (count !== undefined && items.length == count) {
                resolve(items);
                return;
              }
              cursor.continue();
            });
          });
        };
      });

      var exp = {
        open: function open(name, version, upgradeCallback) {
          var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
          var request = p.request;

          if (request) {
            request.onupgradeneeded = function (event) {
              if (upgradeCallback) {
                upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
              }
            };
          }

          return p.then(function (db) {
            return new DB(db);
          });
        },
        delete: function _delete(name) {
          return promisifyRequestCall(indexedDB, 'deleteDatabase', [name]);
        }
      };

      if (typeof module !== 'undefined') {
        module.exports = exp;
        module.exports.default = module.exports;
      } else {
        self.idb = exp;
      }
    })();
  }, {}], 2: [function (require, module, exports) {
    module.exports = function () {
      var idb = require('idb');

      var dbPromise = idb.open('test-db', 1, function (upgradeDb) {
        switch (upgradeDb.oldVersion) {
          case 0:
            upgradeDb.createObjectStore('currencies', { keyPath: 'pair' });
        }
      });(function () {
        function fetchAndStoreCurrencies() {
          var url = 'https://free.currencyconverterapi.com/api/v5/currencies';
          window.fetch(url).then(function (response) {
            return response.json();
          }).then(function (data) {
            var currencies = data.results;
            return currencies;
          }).then(function (currencies) {
            var currenciesArray = Object.values(currencies);
            var currenciesIds = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = currenciesArray[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var currency = _step.value;

                currenciesIds.push(currency.id);
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }

            return currenciesIds;
          }).then(function (currenciesIds) {
            var pairs = [];

            for (var i = 0; i < currenciesIds.length - 1; i++) {
              for (var j = i + 1; j < currenciesIds.length; j++) {
                pairs.push(currenciesIds[i] + "_" + currenciesIds[j]);
              }
            }

            return pairs;
          }).then(function (pairs) {
            var _loop = function _loop(i) {
              var url = "https://free.currencyconverterapi.com/api/v5/convert?q=" + pairs[i];
              window.fetch(url).then(function (response) {
                return response.json();
              }).then(function (res) {
                var val = res.results;
                val = Object.values(val)[0].val;
                var valObj = {
                  pair: pairs[i],
                  value: val
                };
                console.log(valObj);
                return valObj;
              }).then(function (valObj) {
                dbPromise.then(function (db) {
                  var tx = db.transaction('currencies', 'readwrite');
                  var keyValStore = tx.objectStore('currencies');
                  keyValStore.put(valObj);
                  return tx.complete;
                });
              });
            };

            for (var i = 0; i < pairs.length; i++) {
              _loop(i);
            }
          });
        }

        fetchAndStoreCurrencies();
      })();
    };
  }, { "idb": 1 }], 3: [function (require, module, exports) {
    module.exports = function () {
      if (!navigator.serviceWorker) return;
      navigator.serviceWorker.register('js/sw-bundle.min.js').then(function (reg) {
        if (!navigator.serviceWorker.controller) {
          return;
        }

        if (reg.waiting) {
          console.log('service worker waiting');
          return;
        }

        if (reg.installing) {
          console.log('service worker installing');
          return;
        }

        reg.addEventListener('updatefound', function () {
          console.log('service worker updated');
        });
      });

      // Ensure refresh is only called once.
      // This works around a bug in "force update on reload".
      var refreshing = void 0;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (refreshing) return;
        window.location.reload();
        refreshing = true;
      });
    };
  }, {}], 4: [function (require, module, exports) {
    /* globals fetch */

    var _idb = require('./lib/idb.js');
    // _idb()

    var _sw = require('./lib/reg_sw.js');
    _sw();

    var url = 'https://free.currencyconverterapi.com/api/v5/currencies';

    var fromSelect = document.getElementById('fromSelect');
    var toSelect = document.getElementById('toSelect');

    var fromInput = document.getElementById('fromInput');
    var toInput = document.getElementById('toInput');

    function updateOutput(event) {
      if (isNaN(fromInput.value) || fromInput.value < 0) {
        toInput.value = 'Please enter a number greater than zero';
        toInput.style.fontSize = '1rem';
      }
      if (fromInput.value !== '') {
        convertFetch(fromSelect.value, toSelect.value, fromInput.value);
        toInput.style.fontSize = '2rem';
      }
    }

    function clearOutput(event) {
      var key = event.key;
      if (key === 8 || key === 48 || fromInput.value === '') {
        toInput.value = '';
      }
    }

    ;(function events() {
      fromInput.addEventListener('keyup', updateOutput);
      fromInput.addEventListener('keyup', clearOutput);
      fromSelect.addEventListener('change', updateOutput);
      toSelect.addEventListener('change', updateOutput);
    })();

    function fetchSelect() {
      fetch(url).then(function (response) {
        return response.json();
      }).then(function (data) {
        var currencies = data.results;

        currencies = Object.values(currencies);
        currencies.sort(function (a, b) {
          var textA = a.currencyName.toUpperCase();
          var textB = b.currencyName.toUpperCase();
          return textA < textB ? -1 : textA > textB ? 1 : 0;
        });

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = currencies[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var el = _step2.value;

            var currencyName = el.currencyName;
            var currencyId = el.id;

            var option = document.createElement('option');
            if (currencyName.length > 20) {
              currencyName = currencyName.substring(0, 19) + " ...";
            }
            option.innerHTML = currencyName + " (" + currencyId + ")";
            option.value = currencyId;

            var optionClone = option.cloneNode(true);

            fromSelect.appendChild(option);
            toSelect.appendChild(optionClone);
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }).catch(function (err) {
        return console.log(err);
      });
    }

    function convertFetch(from, to, amt) {
      var url = "https://free.currencyconverterapi.com/api/v5/convert?q=" + from + "_" + to;

      if (fetch(url)) {
        fetch(url).then(function (response) {
          return response.json();
        }).then(function (data) {
          var conversion = data.results;

          var value = conversion[Object.keys(conversion)].val;

          var converted = amt * value;
          converted = converted.toFixed(2);

          toInput.value = converted;
        });
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
  }, { "./lib/idb.js": 2, "./lib/reg_sw.js": 3 }] }, {}, [4]);