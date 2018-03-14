// ===============================
// https://stackoverflow.com/a/17694760

var saveSelection, restoreSelection;

if (window.getSelection && document.createRange) {
  saveSelection = function(containerEl) {
    var doc = containerEl.ownerDocument, win = doc.defaultView;
    var range = win.getSelection().getRangeAt(0);
    var preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(containerEl);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    var start = preSelectionRange.toString().length;

    return {
      start: start,
      end: start + range.toString().length
    };
  };

  restoreSelection = function(containerEl, savedSel) {
      var doc = containerEl.ownerDocument, win = doc.defaultView;
      var charIndex = 0, range = doc.createRange();
      range.setStart(containerEl, 0);
      range.collapse(true);
      var nodeStack = [containerEl], node, foundStart = false, stop = false;

      while (!stop && (node = nodeStack.pop())) {
          if (node.nodeType == 3) {
              var nextCharIndex = charIndex + node.length;
              if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                  range.setStart(node, savedSel.start - charIndex);
                  foundStart = true;
              }
              if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                  range.setEnd(node, savedSel.end - charIndex);
                  stop = true;
              }
              charIndex = nextCharIndex;
          } else {
              var i = node.childNodes.length;
              while (i--) {
                  nodeStack.push(node.childNodes[i]);
              }
          }
      }

      var sel = win.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
  };
} else if (document.selection) {
  saveSelection = function(containerEl) {
    var doc = containerEl.ownerDocument, win = doc.defaultView || doc.parentWindow;
    var selectedTextRange = doc.selection.createRange();
    var preSelectionTextRange = doc.body.createTextRange();
    preSelectionTextRange.moveToElementText(containerEl);
    preSelectionTextRange.setEndPoint("EndToStart", selectedTextRange);
    var start = preSelectionTextRange.text.length;

    return {
      start: start,
      end: start + selectedTextRange.text.length
    };
  };

  restoreSelection = function(containerEl, savedSel) {
    var doc = containerEl.ownerDocument, win = doc.defaultView || doc.parentWindow;
    var textRange = doc.body.createTextRange();
    textRange.moveToElementText(containerEl);
    textRange.collapse(true);
    textRange.moveEnd("character", savedSel.end);
    textRange.moveStart("character", savedSel.start);
    textRange.select();
  };
}

// ===============================

var textField = document.getElementById('textfield')
var mySel
textField.addEventListener('focus', function(){
  var range = document.createRange()
  range.selectNodeContents(this)
  var sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
  mySel = saveSelection(this)
})

textField.addEventListener('blur', function(){
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  } else if (document.selection) {
    document.selection.empty();
  }
})

stripHTML = (el) => {
  el.innerHTML = el.innerHTML.replace(/<\/p>\s*<p.*>/igu, "ZOOPDOG-LINEBREAKZOOPDOG-LINEBREAK")
                             .replace(/<div>(.*?)<\/div>/, "ZOOPDOG-LINEBREAK$1")
                             .replace(/<\/?(font|span|p|div).*?>/igu, "")
                             .replace(/ZOOPDOG-LINEBREAK/igu, "<br>")
                             .normalize()
                             .trim()
  restoreSelection(el, mySel)
}

textField.addEventListener('paste', function(e) {
  stripHTML(this)
  restoreSelection(this, mySel)
})

textField.addEventListener('keyup', function(e) {

  // adapted from https://stackoverflow.com/a/35761139
  //if the last character is a zero-width space, remove it
  var lastCharCode = this.innerHTML.charCodeAt(this.innerHTML.length - 1)
  if (lastCharCode == 8203) {
    this.innerHTML = this.innerHTML.slice(0, -1)
  }

  mySel = saveSelection(this)
  if (e.which === 13) {
    var selection = window.getSelection();
    var range = selection.getRangeAt(0);
    var br = document.createElement("br");
    var zwsp = document.createTextNode("\u200B");
    var textNodeParent = document.getSelection().anchorNode.parentNode;
    var inSpan = textNodeParent.nodeName == "SPAN";
    var span = document.createElement("span");

    // if the carat is inside a <span>, move it out of the <span> tag
    if (inSpan) {
      range.setStartAfter(textNodeParent);
      range.setEndAfter(textNodeParent);
      // create a new span on the next line
      range.insertNode(span);
      range.setStart(span, 0);
      range.setEnd(span, 0);
    }

    // add a zero-width character
    range.insertNode(zwsp);
    range.setStartBefore(zwsp);
    range.setEndBefore(zwsp);

    // insert the new range
    selection.removeAllRanges();
    selection.addRange(range);
    zwsp.parentNode.removeChild(zwsp)
    return false;

  } else if (e.which === 8) {

    this.innerHTML = this.innerHTML.replace(/(<br>)*$/iu, "")
    stripHTML(this)
    this.innerHTML = this.innerHTML.replace(/(<br>)*$/iu, "")
    stripHTML(this)

  } else {

    stripHTML(this)

  }

})

const chars = /[-\u00D0A-Za-zÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀẾỂưăạảấầẩẫậắằẳẵặẹẻẽếềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụúủứừỬỮỰỲỴÝỶỸửữựỳýỵỷỹ]/gu

const getWordAndContext = (mouse) => { // adapted from https://stackoverflow.com/a/30606508
  var range, textNode, offset;

  if (document.caretPositionFromPoint) {    // Firefox
    range = document.caretPositionFromPoint(mouse.x, mouse.y)
    textNode = range.offsetNode
    offset = range.offset
  } else if (document.caretRangeFromPoint) {     // Chrome
    range = document.caretRangeFromPoint(mouse.x, mouse.y) || document.caretRangeFromPoint(mouse.pageX, mouse.pageY)
    textNode = range.startContainer
    offset = range.startOffset
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
  return {word: word, context: context, node: textNode, begin: begin}
}

const generateCandidates = (context, howManyWords) => {
  var split = context.split(/\s+/),
      candidates = []
  for (i = 0; i < howManyWords && candidates.length < split.length; i ++) {
    candidates.push(split.slice(0, i+1).join(" ").replace(/[Đ\u00D0]/ug, "đ"))
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

const dunzo = () => {
  window.setTimeout(function(){
    var dunzo = document.createElement('div')
    dunzo.classList.add('dunzo')
    document.body.append(dunzo)
  }, 2000)
}

window.onload = function() {

  const db = new Dexie("entries")
  db.version(2).stores({
    entries: '++,vn,en',
  })

  const jsonURL = 'js/vnedict.json'

  db.on('ready', function () {
    return db.entries.count(function (count) {
      if (count > 0) {
        console.log("Database is already populated.")
        dunzo()
      } else {
        console.log("Database is empty. Loading entries from dictionary file...")
        return new Dexie.Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();
          xhr.onreadystatechange = function(){
            if (xhr.readyState === XMLHttpRequest.DONE) {
              if (xhr.status === 200) {
                resolve(JSON.parse(xhr.responseText))
              } else {
                reject(xhr)
              }
            }
          }
          xhr.open("GET", jsonURL, true);
          xhr.send()
        }).then(function (data) {
          return db.transaction('rw', db.entries, function () {
            data.forEach(function (item) {
              db.entries.add(item)
            })
          })
        }).then(function() {
          db.entries.count((count) => console.log(`Committed ${count} entries.`))
          dunzo()
        })
      }
    })
  })

  db.open()

  if (!/Chrome|Firefox/.test(navigator.userAgent)) {
    alert("This demo page is not compatible with Safari.\nPlease use Chrome instead.")
  }

  Pace.on('done', function(){
    textfield.style.opacity = 1
    Array.from(document.getElementsByClassName('pace')).forEach(function(el){
      el.style.pointerEvents = 'auto'
    })
    document.getElementById('loading-message').style.display = 'none'
    document.getElementById('instructions').style.display = 'block'
  })

  this.highlighter = new Highlighter()
  this.popup = new ResultFrame('zd-extension/frame.html')
  this.zoopdogIsOn = true
  var self = this

  window.addEventListener('resize', function(e){
    self.highlighter.off()
    self.popup.hide()
    self.highlighter = new Highlighter()
  })

  textField.addEventListener('scroll', function(e){
    self.highlighter.off()
    self.popup.hide()
  })

  textField.addEventListener('mouseout', function(e){
    self.highlighter.off()
    self.popup.hide()
  })

  window.addEventListener('keydown', e => {
    if (e.which === 16) {
      self.highlighter.toggleLock()
      self.popup.toggleLock()
    }
  })

  var oldWord
  textField.addEventListener('mousemove', function(e){

    if (self.popup.locked || !self.zoopdogIsOn) return true

    var mouse = {x: e.clientX, y: e.clientY}
    if (self.highlighter.highlights.length && mouseInRects(mouse, self.highlighter.highlights)) return true

    var origin = getWordAndContext(mouse)
    var el = document.elementFromPoint(mouse.x, mouse.y)

    if (!origin) return true
    if (!origin.word) return true

    self.highlighter.off()
    self.popup.hide()

    if (Array.from(el.childNodes).indexOf(origin.node) === -1) return true
    if (origin.word === oldWord) return true
    oldWord = origin.word

    var searchTerm = origin.word.replace(/[Đ\u00D0]/ug, "đ")

    db.entries
      .where('vn')
      .startsWithIgnoreCase(searchTerm + " ")
      .uniqueKeys((keysArray) => {

        keysArray.sort(function(a, b){
          return b.length - a.length
        })
        var range = keysArray.length ? keysArray[0].split(" ").length : 1
        return generateCandidates(origin.context, range)

      }).then((candidates) => {

        return db.entries
          .where('vn')
          .anyOfIgnoreCase(candidates)
          .toArray()

      }).then((results) => {

        if (!results.length) return false

        results.sort(function(a, b){
          return b['vn'].split(" ").length - a['vn'].split(" ").length
        })
        var numOfWordsToHighlight = results[0]['vn'].split(" ").length
        self.highlighter.on(origin.node, origin.begin, numOfWordsToHighlight)
        self.popup.populate(results)
        if (self.highlighter.highlights) self.popup.show(self.highlighter.highlights[0])
        setTimeout(() => {
          oldWord = null
        }, 500) // this is necessary to prevent flickers but allow intentionally going off and back on the same word
      })

  })

}
