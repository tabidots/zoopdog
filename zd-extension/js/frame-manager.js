var myHeight = document.body.scrollHeight,
popupBody = document.getElementById("zoopdog-popup-body")
const myTemplate = Handlebars.compile(document.getElementById('zoopdog-popup-template').innerHTML)
const sendSize = (ofWhat, toWhere) => {
    // https://stackoverflow.com/questions/10949370/resizing-iframe-to-dynamic-content-from-chrome-extension-content-script
    var myHeight = ofWhat.scrollHeight
    var myWidth = ofWhat.scrollWidth
    var htmlStyle = window.getComputedStyle(document.getElementsByTagName("HTML")[0])
    toWhere.postMessage({
        type: 'resize',
        dimensions: {height: myHeight,
        width: myWidth,
        verticalPadding: parseInt(htmlStyle.marginTop, 10) * 2,
        horizontalPadding: parseInt(htmlStyle.marginLeft, 10) * 2 }}, 
    "*")
    document.body.style.overflowY = (myHeight > 300) ? "scroll" : "hidden" 
}

window.addEventListener('message', function(event) {
    if (event.data.type === "populate") {
        popupBody.style.width = '0px'
        popupBody.innerHTML = myTemplate(event.data)

    try { // on webpage
        Array.from(document.getElementsByClassName("zd-pronunciation")).forEach(div => {
            div.innerHTML = pronunciationGuide(div.innerHTML)[window.parent.document.getElementById("dialect-menu").value].zd
        })
        drawTonesAndGradients()
        sendSize(popupBody, event.source)
    
    } catch (e) { // within Chrome extension
        Array.from(document.getElementsByClassName("zd-pronunciation")).forEach(div => {
            div.innerHTML = pronunciationGuide(div.innerHTML)[event.data.dialect].zd
        })
        drawTonesAndGradients()
        sendSize(popupBody, event.source)
    }
                                            
    } else if (event.data.type === "lock") {
        document.getElementById("zoopdog-popup-lock-icon").style.visibility = "visible"
    } else if (event.data.type === "unlock") {
        document.getElementById("zoopdog-popup-lock-icon").style.visibility = "hidden"
    }
})
  
window.addEventListener('keydown', e => {
    if (e.key === 'Shift') {
        try { // within Chrome extension
            window.postMessage({ type: 'toggle-lock' }, "*")
        } catch (e) { // on webpage
            window.parent.highlighter.toggleLock()
            window.parent.popup.toggleLock()
        }
    }
  })