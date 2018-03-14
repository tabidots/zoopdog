const colors = {
  blue:    {light: "#5BB1B7", dark: "#0685AA", verylight: "#96CDD1"},
  red:     {light: "#B6638F", dark: "#9B2966"},
  neutral: {light: "#ECE2D0", dark: "#BFB5AF"}
}

class ToneCanvas {
  constructor(el) {
    var rect = el.getBoundingClientRect()
    this.canvas = document.createElement('canvas')
    this.canvas.classList.add('zd-tone-canvas')
    this.canvas.style.position = 'absolute'
    this.canvas.style.left = 0
    this.canvas.style.top = `-${rect.height / 2}px`
    this.canvas.style.zIndex = 100000
    this.canvas.style.pointerEvents = 'none' //Make sure you can click 'through' the canvas
    this.context = null
    el.appendChild(this.canvas)
    this.context = this.canvas.getContext("2d")
    // https://stackoverflow.com/questions/28142351/canvas-lineto-drawing-y-coordinate-in-wrong-place
    this.canvas.width = this.canvas.offsetWidth
    this.canvas.height = this.canvas.offsetHeight
    this.context.globalAlpha = 1
  }
}

const drawCircleX = (center, context) => {
  context.beginPath()
  context.fillStyle = colors.neutral.light
  context.strokeStyle = colors.red.light
  context.lineWidth = 1
  context.setLineDash([])
  context.arc(center.x, center.y, 4, 0, 2*Math.PI)
  context.fill()
  context.stroke()

  context.beginPath()
  context.moveTo(center.x - 3, center.y - 3)
  context.lineTo(center.x + 3, center.y + 3)
  context.stroke()
  context.beginPath()
  context.moveTo(center.x + 3, center.y - 3)
  context.lineTo(center.x - 3, center.y + 3)
  context.stroke()
}

const drawDot = (center, context) => {
  context.fillStyle = colors.red.light
  context.beginPath()
  context.arc(center.x, center.y, 4, 0, 2*Math.PI)
  context.fill()
}

const drawGradients = (word) => {
  // make the tone lines appear on top of the bg colors but underneath the letters
  var chars = word.querySelector(".phonemes").cloneNode(true)
  chars.classList.add("blank-bg")
  chars.style.zIndex = 100001
  word.appendChild(chars)

  // ========================================================
  // GRADIENTS FOR GLIDES & MINOR VOWELS
  // ========================================================

  Array.from(word.querySelectorAll(".phonemes:not(.blank-bg) .glide")).forEach(phoneme => {
    var defaultColor  = colors.neutral.light
      , startColor    = (phoneme.previousSibling) ? window.getComputedStyle(phoneme.previousSibling).backgroundColor : colors.neutral.light
      , endColor      = (phoneme.nextSibling) ? window.getComputedStyle(phoneme.nextSibling).backgroundColor : colors.neutral.light
      , gradient      = chroma.scale([startColor, endColor]).mode('lab').colors(5)
      , res           = "linear-gradient(to right, "
    if (startColor === "rgba(0, 0, 0, 0)") {
      console.log(phoneme.previousSibling)
    }
    gradient.forEach((color, i) => {
      var rgb = chroma(color).rgb()
      res += `rgb(${rgb[0]},${rgb[1]},${rgb[2]}) ${i * 20}%, `
    })
    res = res.substring(0, res.length - 2) + ")"
    phoneme.style.background = res
  })
}


const drawTonesAndGradients = () => {
  Array.from(document.querySelectorAll(".block.on .pron .zoopdog-word, dt.zd .zoopdog-word, .zd-pronunciation .zoopdog-word")).forEach(word => {

    drawGradients(word)

    var tone = word.getAttribute("tone")
    if (!tone) return true

    word.canvas = word.querySelector("canvas")
    if (word.canvas) {
      word.removeChild(word.canvas)
      word.removeChild(word.querySelector(".blank-bg"))
    }

    word.canvas = new ToneCanvas(word)

    var glottalStop = (/ʔ/.test(tone)) ? true : false
      , short       = (/_/.test(tone)) ? true : false
      , h           = word.canvas.canvas.height
      , w           = word.canvas.canvas.width
      , startX      = 5
      , middleX     = w / 2
      , endX        = (short) ? middleX : w - 5
      , middleY     = h / 2
      , levels      = tone.replace(/[^˩˨˧˦˥]/gi, "").split("").map(x => ((x.charCodeAt(0) - 740) * -1) + 5)
      , yCoords     = [h - 5, middleY + (h / 4), middleY, middleY - (h / 4), 5]
      , ctx         = word.canvas.context

    if (!ctx.setLineDash) ctx.setLineDash = function () {} // https://www.rgraph.net/blog/html5-canvas-dashed-lines.html

    // https://stackoverflow.com/a/27878480/4210855
    // http://community.openfl.org/t/html5-canvas-and-blurry-rendering-devicepixelratio-is-needed/7135/6
    var devicePixelRatio  = window.devicePixelRatio || 1
      , backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                            ctx.mozBackingStorePixelRatio ||
                            ctx.msBackingStorePixelRatio ||
                            ctx.oBackingStorePixelRatio ||
                            ctx.backingStorePixelRatio || 1
    , ratio = devicePixelRatio / backingStoreRatio
    if (ratio > 1) {
      word.canvas.canvas.height = h * ratio
      word.canvas.canvas.width = w * ratio
      ctx.scale(ratio, ratio)
    }

    // ========================================================
    // TONE LINE
    // ========================================================

    ctx.beginPath()
    ctx.lineWidth = 2

    if (/\u0330/.test(tone)) ctx.setLineDash([1, 4]) // "harsh voice" phonation
    if (/\u0324/.test(tone)) ctx.lineWidth = 5 // "breathy voice" phonation

    // special case - hanoi nga tone - add midpoint for readability
    if (glottalStop && !short && levels.length === 2) levels.splice(1, 0, (levels[0] + levels[1]) / 2)

    ctx.moveTo(startX, yCoords[levels[0]])
    var yCoordAtMidpoint
    if (levels.length === 3) {
      ctx.quadraticCurveTo(middleX - (middleX / 2), yCoords[levels[0]], middleX, yCoords[levels[1]])
      ctx.quadraticCurveTo(middleX + (middleX / 2), yCoords[levels[2]], endX, yCoords[levels[2]])
      yCoordAtMidpoint = yCoords[levels[1]]
    } else {
      var s = (short) ? middleX / 2 : middleX
      ctx.quadraticCurveTo(s, yCoords[levels[0]], endX, yCoords[levels[levels.length-1]])
      // https://stackoverflow.com/questions/5634460/quadratic-b%C3%A9zier-curve-calculate-points
      yCoordAtMidpoint = (short) ? yCoords[levels[1]] : (.5 * .5 * yCoords[levels[0]]) + (2 * .5 * .5 * yCoords[levels[0]]) + (.5 * .5 * yCoords[levels[levels.length-1]])
    }
    ctx.lineCap = "round"
    ctx.strokeStyle = colors.red.light
    ctx.stroke()

    // ========================================================
    // POINTS
    // ========================================================

    // start point
    if (word.classList.contains("preglottalized")) drawCircleX({x: startX, y: yCoords[levels[0]]}, ctx)
    else drawDot({x: startX, y: yCoords[levels[0]]}, ctx)
    // midpoint for glottal stop words (hanoi nga / nang)
    if (glottalStop) drawCircleX({x: middleX, y: yCoordAtMidpoint}, ctx)
    // endpoint (for all tones except Hanoi nang, because it ends on a stop)
    if (!(glottalStop && short)) drawDot({x: endX, y: yCoords[levels[levels.length-1]]}, ctx)

  })
}
