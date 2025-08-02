class ResultFrame { // adapted from https://github.com/FooSoft/yomichan/blob/master/ext/fg/js/popup.js

  constructor(srcUrl) {
    this.container = document.createElement('iframe')
    this.container.id = 'zoopdog-popup'
    this.container.addEventListener('mousedown', e => e.stopPropagation())
    this.container.addEventListener('scroll', e => e.stopPropagation())
    this.container.setAttribute('src', srcUrl || chrome.runtime.getURL('../frame.html'))
    this.container.style.width = '0px'
    this.container.style.height = '0px'
    this.injected = null
    this.locked = false
    var self = this
    window.addEventListener('message', function(event) {
      if (event.data.type === 'resize') self.resize(event.data.dimensions)
    })
  }

  inject() {
    if (!this.injected) {
      this.injected = new Promise((resolve, reject) => {
        this.container.addEventListener('load', resolve)
        document.body.appendChild(this.container)
      })
    }
    return this.injected
  }

  populate(results) {
    return this.inject().then(() => {
      this.container.contentWindow.postMessage({type: 'populate', results: results, dialect: this.dialect}, '*')
      })
  }

  show(rect) {
    return this.inject().then(() => {
      this.container.style.visibility = 'visible'
      this.container.style.position = 'fixed'
      this.container.style.zIndex = '100000'
      this.container.style.left = `${rect.left - 20}px`
      this.container.style.top = `${rect.bottom}px`
      this.container.style.bottom = 'auto'

      var popupDimensions =  this.container.getBoundingClientRect()

      var rightEdge = popupDimensions.right
      if (rightEdge > window.innerWidth) {
        var xDif = rightEdge - window.innerWidth
        this.container.style.left = `${parseInt(this.container.style.left, 10) - xDif - 20}px`
      }
      var bottomEdge = popupDimensions.bottom
      if (rect.top > window.innerHeight / 2) {
        var yDif = window.innerHeight - rect.top
        this.container.style.top = 'auto'
        this.container.style.bottom = `${yDif + 10}px`
      }
      var leftEdge = popupDimensions.left
      if (leftEdge < 20) this.container.style.left = '20px'


    })
  }

  hide() {
    if (this.locked) return true
    this.container.style.visibility = 'hidden'
  }

  toggleLock() {
    if (this.locked) {
      this.locked = false
      this.container.contentWindow.postMessage({type: 'unlock'}, '*')
      this.hide()
    } else if (this.container.style.visibility === 'visible') {
      this.locked = true
      this.container.contentWindow.postMessage({type: 'lock'}, '*')
    }
  }

  resize(dimensions) {
    var newHeight = Math.min(300, dimensions.height) + dimensions.verticalPadding + 20
    var newWidth = Math.max(200, dimensions.width) + dimensions.horizontalPadding
    this.container.style.height = `${newHeight}px`
    this.container.style.width = `${newWidth}px`
  }
}
