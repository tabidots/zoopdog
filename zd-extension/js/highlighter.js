class Highlighter {

  constructor() {
    this.highlights = []
    this.padding = 5
    this.locked = false

    this.canvas = document.createElement('canvas')
    this.canvas.id = 'zoopdog-canvas'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    this.canvas.style.position = 'fixed'
    this.canvas.style.left = 0;
    this.canvas.style.top = '1px' // slight offset required for precise positioning
    this.canvas.style.zIndex = 100000
    this.canvas.style.pointerEvents = 'none' //Make sure you can click 'through' the canvas
    this.context = null
    this.rangeRect = null
    document.body.appendChild(this.canvas); //Append canvas to body element
    this.context = this.canvas.getContext("2d")
  }

  on(node, begin, howManyWords) { // adapted from https://stackoverflow.com/a/31369978

    if (this.highlights.length) this.off()
    if (node === undefined) return true

    // find endpoint (measured by number of spaces)
    var words = 0,
        prevChar = "";
    for (i = begin; i < node.data.length; i++) {
      if (node.data[i] === " ") {
        if (prevChar && prevChar.match(chars)) words++
      } else if (!node.data[i].match(chars)) { // break on punctuation
        break
      }
      if (words === howManyWords) {
        break
      }
      prevChar = node.data[i]
    }
    if (i === begin) return true
    if (node.data[begin] === " ") begin++

    // https://stackoverflow.com/a/39877924
    var range = new Range()
    range.setStart(node, begin)
    range.setEnd(node, i)

    this.highlights = range.getClientRects()
    for (var hl of this.highlights) {
      this.context.rect(hl.left - this.padding,
                        hl.top - this.padding,
                        hl.width + (this.padding * 2),
                        hl.height + (this.padding * 2))
      this.context.globalAlpha = 0.25
      this.context.fillStyle = '#B6638F'
      this.context.fill()
    }
  }

  off() {
    if (this.locked) return true
    this.context.beginPath();
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.globalAlpha = 0
    this.highlights = []
  }

  toggleLock() {
    if (this.locked) {
      this.locked = false
      this.off()
    } else if (this.highlights.length) {
      this.locked = true
    }
  }

}
