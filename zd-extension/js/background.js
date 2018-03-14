const db = new Dexie("entries")
db.version(2).stores({
  entries: '++,vn,en',
})

const jsonURL = chrome.extension.getURL('js/vnedict.json')
const opts = {method: 'GET', headers: {}}

populateFrom = (url) => {
  fetch(url, opts).then(function (response) {
    return response.json();
  }).then(function (data) {
    return db.transaction('rw', db.entries, function () {
      data.forEach(function (item) {
        db.entries.add(item)
      })
    })
  }).then(function () {
      db.entries.count((count) => console.log(`Committed ${count} entries.`))
  })
}

db.on('ready', function () {
  return db.entries.count(function (count) {
    if (count > 0) {
      console.log("Database is already populated.")
    } else {
      console.log("Database is empty. Loading entries from dictionary file...")
      populateFrom(jsonURL)
    }
  })
})

db.open()

db.entries.each(function (obj) {
}).then(function () {
  console.log("Finished.")
}).catch(function (error) {
  console.error(error.stack || error);
})

var zoopdogIsGloballyOn = true
  , myDialect;
chrome.storage.sync.get({
  myDialect: "hanoi"
}, function(items) {
  myDialect = items.myDialect
})

/*setInterval(function(){
  console.log(zoopdogIsGloballyOn)
}, 750)*/

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === 'initial-search') {
    db.entries
      .where('vn')
      .startsWithIgnoreCase(message.term + " ")
      .uniqueKeys((keysArray) => {
        keysArray.sort(function(a, b){
          return b.length - a.length
        })
        var range = keysArray.length ? keysArray[0].split(" ").length : 1
        sendResponse({type: 'range', range: range})
      })

  } else if (message.type === 'second-search') {
    db.entries
      .where('vn')
      .anyOfIgnoreCase(message.candidates)
      .toArray()
      .then((results) => {
        results.sort(function(a, b){
          return b['vn'].split(" ").length - a['vn'].split(" ").length
        })
        sendResponse({type: 'results', results: results})
      })

  } else if (message.type === 'reload-db') {
    console.log("Reloading DB...")
    db.entries.clear().then(() => {
      populateFrom(jsonURL)
    })

  } else if (message.type === 'check-globally-on') {
    sendResponse({type: 'globally-on', status: zoopdogIsGloballyOn})

  } else if (message.type === 'toggle-zoopdog') {
    zoopdogIsGloballyOn = (zoopdogIsGloballyOn) ? false : true
    chrome.tabs.query({}, function(tabs){
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {type: "toggle-zoopdog", status: zoopdogIsGloballyOn}, function(response) {})
      })
    })

  } else if (message.type === 'toggle-lock') {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      chrome.tabs.sendMessage(tabs[0].id, {type: "toggle-lock"}, function(response){})
    })

  } else if (message.type === 'get-dialect') {
    sendResponse({type: 'dialect', dialect: myDialect})
  } else if (message.type === 'set-dialect') {
    console.log("setting dialect to " + message.dialect)
    myDialect = message.dialect
    chrome.storage.sync.set({
      myDialect: message.dialect
    }, function(){})
  }

  return true
})
