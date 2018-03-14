window.onload = function() {

  chrome.runtime.sendMessage({type: 'check-globally-on'}, function(response) {
    document.getElementById("zoopdog-switch").checked = response.status
  })
  chrome.runtime.sendMessage({type: 'get-dialect'}, function(response){
    document.querySelector(`#dialect-menu option[value=${response.dialect}]`).selected = true
  })


  document.getElementById("zoopdog-switch").addEventListener("click", function(){
    chrome.runtime.sendMessage({type: 'toggle-zoopdog'}, function(response) {})
  })
  document.getElementById("zoopdog-reload").addEventListener("click", function(){
    chrome.runtime.sendMessage({type: 'reload-db'}, function(response) {})
  })
  document.getElementById("dialect-menu").addEventListener("change", function(){
    chrome.runtime.sendMessage({type: 'set-dialect', dialect: this.value}, function(response) {})
  })
  document.getElementById("open-pron-guide").addEventListener("click", function(){
    chrome.tabs.create({ url: "http://tabidots.io/zoopdog/pronguide.html" });
  })

}
