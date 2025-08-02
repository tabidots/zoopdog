const chars = /[-\u00D0A-Za-zÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀẾỂưăạảấầẩẫậắằẳẵặẹẻẽếềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụúủứừỬỮỰỲỴÝỶỸửữựỳýỵỷỹ]/gu

const getWordAndContext = (mouse) => { // adapted from https://stackoverflow.com/a/30606508
  var range, textNode, offset;

  // Use modern APIs with fallbacks
  if (document.caretPositionFromPoint) {    // Firefox
    range = document.caretPositionFromPoint(mouse.x, mouse.y)
    if (!range) {
      return false
    }
    textNode = range.offsetNode
    offset = range.offset
  } else if (document.caretRangeFromPoint) {     // Chrome (deprecated but still works)
    range = document.caretRangeFromPoint(mouse.x, mouse.y)
    if (!range) {
      return false
    }
    textNode = range.startContainer
    offset = range.startOffset
  } else {
    // Fallback for browsers that don't support either
    return false
  }

  //data contains a full sentence
  //offset represent the cursor position in this sentence
  var data = textNode.data,
    i = offset,
    begin,
    end,
    clauseEnd;

  if (data === undefined || i === data.length) return false
  if (data[i] === " ") return false

  //Find the begin of the word (space)
  while (i > -1 && data[i].match(chars)) { --i }
  begin = i + 1

  //Find the end of the word
  i = offset
  while (i < data.length && data[i].match(chars)) { ++i }
  end = i

  //Go forward until the end of a clause (non-space, non-letter)
  i = offset
  while (i < data.length && (data[i].match(chars) || data[i] === " ")) { ++i }
  contextEnd = i

  //Return the word under the mouse cursor
  var word = data.substring(begin, end).trim(),
    context = data.substring(begin, contextEnd).trim()
  return { word: word, context: context, node: textNode, begin: begin }
}

const generateCandidates = (context, howManyWords) => {
  var split = context.split(/\s+/),
    candidates = []
  for (i = 0; i < howManyWords && candidates.length < split.length; i++) {
    candidates.push(split.slice(0, i + 1).join(" ").replace(/[Đ\u00D0]/ug, "đ"))
  }
  return candidates
}

const mouseInRects = (mouse, rects) => {
  for (var rect of rects) {
    if (rect.left <= mouse.x && mouse.x <= rect.right &&
      rect.top <= mouse.y && mouse.y <= rect.bottom) return true
  }
  return false
}

window.onload = function () {

  this.highlighter = new Highlighter()
  this.popup = new ResultFrame()

  chrome.runtime.sendMessage({ type: 'get-dialect' }, function (response) {
    this.popup.dialect = response.dialect
  })

  chrome.runtime.sendMessage({ type: 'check-globally-on' }, function (response) {
    this.zoopdogIsOn = response.status
  })

  this.addEventListener('resize', function (e) {
    this.highlighter.off()
    this.popup.hide()
    this.highlighter = new Highlighter()
  })

  this.addEventListener('scroll', function (e) {
    this.highlighter.off()
    this.popup.hide()
  })

  this.addEventListener('mouseout', function (e) {
    this.highlighter.off()
    this.popup.hide()
  })

  // Updated keydown handler - use e.key instead of e.which
  window.addEventListener('keydown', e => {
    if (e.key === 'Shift') {
      this.highlighter.toggleLock()
      this.popup.toggleLock()
    }
  })

  var oldWord
  this.addEventListener('mousemove', function (e) {

    if (this.popup.locked || !this.zoopdogIsOn) return true

    var mouse = { x: e.clientX, y: e.clientY }
    if (this.highlighter.highlights.length && mouseInRects(mouse, this.highlighter.highlights)) return true

    var origin = getWordAndContext(mouse)
    var el = document.elementFromPoint(mouse.x, mouse.y)

    if (!origin) return true
    if (!origin.word) return true

    this.highlighter.off()
    this.popup.hide()

    if (Array.from(el.childNodes).indexOf(origin.node) === -1) return true
    if (origin.word === oldWord) return true
    oldWord = origin.word

    var searchTerm = origin.word.replace(/[Đ\u00D0]/ug, "đ")
    chrome.runtime.sendMessage({ type: 'initial-search', term: searchTerm }, function (response) {
      if (response.type === "range") {
        var candidates = generateCandidates(origin.context, response.range)
        chrome.runtime.sendMessage({ type: 'second-search', candidates: candidates }, function (response) {
          if (response.type === "results" && response.results.length) {
            var numOfWordsToHighlight = response.results[0]['vn'].split(" ").length
            this.highlighter.on(origin.node, origin.begin, numOfWordsToHighlight)
            this.popup.populate(response.results)
            if (this.highlighter.highlights) this.popup.show(this.highlighter.highlights[0])
            setTimeout(() => {
              oldWord = null
            }, 500) // this is necessary to prevent flickers but allow intentionally going off and back on the same word
          }
        })
      }
    })

  })

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === 'toggle-zoopdog') {
      if (message.status) {
        window.zoopdogIsOn = true
      } else {
        window.zoopdogIsOn = false
        window.highlighter.off()
        window.popup.hide()
      }
    } else if (message.type === 'toggle-lock') {
      window.highlighter.toggleLock()
      window.popup.toggleLock()
    } else if (message.type === 'set-dialect') {
      window.popup.dialect = message.dialect
    }

  })
}