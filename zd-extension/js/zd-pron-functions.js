// Little utility functions to make life easier

String.prototype.cleanUpNumbers = function(){
  return this.replace(/[,\.](?=\d{3})/gi, "")
             .replace(/\,(?=\d{1,2}\b)/gi, ".")
}

// https://stackoverflow.com/a/29622653/4210855
const longestKeyFirstIterable = (o) => {
  return Object.keys(o).sort((a, b) => b.length - a.length).reduce((r, k) => (r[k] = o[k], r), {})
}

const longestKeyFirst = (o) => {
  return Object.keys(o).sort((a, b) => b.length - a.length)
}

const dissect = (word) => {
  /* ======================================================== //
  // Break a word down into the following components:         //
  // INITIAL string corresponding to a key in initialsToIPA   //
  // GLIDE boolean                                            //
  // RIME string corresponding to a key in rimesToIPA         //
  // TONE string corresponding to a key in toneTable          //
  // ======================================================== */

  var tone = ""
  for (var toneKey in toneTable) {
    if (toneTable[toneKey].test(word)) {
      tone = toneKey
      break
    }
  }
  for (var baseVowel in vowelTable) {
    var tonedVowels = vowelTable[baseVowel]
    word = word.replace(tonedVowels, baseVowel)
  }

  word = word.replace(/uy([aêuctn])/, "ui$1")
  var initial = longestKeyFirst(initialsToIPA).find((i) => word.startsWith(i)) || ""
    , rime    = longestKeyFirst(rimesToIPA).find((r) => {
        // first statement prevents incorrect separation of words like "gia", "quy"
        if (initial.length) return word.endsWith(r) && !r.startsWith(initial.slice(-1))
        else if (r === "iêu") return word === "yêu"
        else if (r === "iên") return word === "yên"
        else return word.endsWith(r) // vowel-initial words
      })
    , glide   = (word.length > (initial + rime).length || word.startsWith("qu"))

  // Exceptions
  if (word === "gi") rime = "i"
  else if (word === "gin") rime = "in" // giữ gìn
  else if (word === "giêng") rime = "iêng"

  return [initial, glide, rime, tone]

}

const addTone = (word, tone) => {
  /* ======================================================== //
  // Place a given tone mark on the correct letter in a word, //
  // in accordance with Vietnamese spelling rules.            //
  // ======================================================== */

  var split     = /(\S*)([mtp]|ch?|n[gh]?)$/.exec(word) || [word, word, ""]
    , beginning = split[1]
    , coda      = split[2]
    , result    = ""
    , toneMark  = toneCodes[tone] || ""
  if (word === "qua") result = beginning + toneMark
  else if (/[ouư]?[aeioơôuư][iou]$|[aăâ]y$|[uư]a$/.test(word) || beginning === "oi") result = beginning.slice(0, -1) + toneMark + beginning.slice(-1)
  else result = beginning + toneMark + coda
  return result.normalize()
}

const construct = (i, glide, r, tone) => {
  /* ======================================================== //
  // Construct a word from the same components in `dissect`,  //
  // in accordance with Vietnamese spelling rules.            //
  // ======================================================== */

  // Prevent impossible initials
  if (/^n?gh/.test(i) && (/^[oau]/.test(r) || glide)) return null
  if (/^n?g$/.test(i) && (/^[ieê]/.test(r) || !glide)) return null

  // Prevent impossible glides/rimes
  if (glide) {
    if (/^[oôưu]/.test(r)) return null                // prevent hoong, nguưa
    if (i === "" && /^(a|u?ya)$/.test(r)) return null // prevent "uya", "oa"
    if (/v|gi|r/.test(i)) return null                 // prevent nonsensical results for "duyên"
    if (r.startsWith("i")) r = "y" + r.slice(1)       // fix spelling: u-glide + i = uy
  } else if (i === "gi") {
    if (r === "i") i = "g"                            // gi
    else if (r.startsWith("i")) return null           // prevent cases like "giiep"
  }

  if (i.endsWith("u")) var g = ""         // don't add another "u" to "qu"
  else if (!glide) var g = ""
  else if (/^[ae]/.test(r)) var g = "o" // on-glide is "o" before a/e (hoàng, khoẻ)
  else var g = "u"

  return addTone((i + g + r), tone)

}

const loopThroughNumbers = (number, dialect) => {
  //* ======================================================== //
  // Interal function to convert a number into a sequence of   //
  // numbers that correspond to words.                         //
  // ========================================================= */
  var result = []
  while (number > 0) {
    var unit         = (number > 9) ? parseInt(longestKeyFirst(numbers).find(x => x.length <= number.toString().length)) : 1
      , howManyUnits = (unit > 9) ? Math.floor(number / unit) : number
      , remainder    = number % unit
      , difference   = unit - remainder

    if (howManyUnits > 9) {
      result = result.concat(loopThroughNumbers(howManyUnits, dialect))
      result.push(numbers[unit.toString()][dialect])
    } else if (howManyUnits === 0) {

    } else {
      if (howManyUnits === 1 && unit === 10) {} else { result.push(numbers[howManyUnits.toString()][dialect]) }
      if (unit > 1) result.push(numbers[unit.toString()][dialect])
    }
    if (901 <= difference && difference < 1000) result.push("không trăm")
    else if (91 <= difference && difference < 100) result.push(numbers["0"][dialect])
    number = number % unit
  }
  return result
}

const numbersToWords = (number, dialect) => {
  //* ======================================================== //
  // "Spell out" a given number (can be string or number) in   //
  // the appropriate dialect.                                  //
  // ========================================================= */

  dialect = dialect || "hanoi"
  number = (typeof number === "number") ? number.toString() : number // idiot-proofing
  var sourceArray = number.split(".")
  if (sourceArray.length > 2) return number // incomprehensible input
  else if (sourceArray[0].length > 10) return number // number is bigger than 9.99 billion

  result = loopThroughNumbers(parseInt(sourceArray[0], 10), dialect)

  if (sourceArray.length === 2) { // read decimal points as "point number number"
    result.push("chấm")
    var decimal = sourceArray[1].split("").map(n => numbers[n][dialect])
    result = result.concat(decimal)
  }

  return result.join(" ")
               .replace(/ năm/gi, " lăm")
               .replace(/ mười/gi, " mươi")
               .replace(/ mươi một/gi, " mươi mốt")
}

const wordPronunciation = (word) => {
  /* ======================================================== //
  // For each dialect, produce a pronunciation guide for the  //
  // given word in two formats: a fairly narrow IPA           //
  // transcription and a less technical transcription         //
  // with HTML formatting more suitable for consumption by    //
  // laypeople on the web.                                    //
  // ======================================================== */
  var [initial, glide, rime, tone] = dissect(word)
    , g                            = (glide) ? "ʷ" : ""
    , result                       = {}

  dialects.forEach(dialect => {

    result[dialect] = {ipa: word, zd: word}

    if (/^\d{1,10}(\.\d{1,2})?$/.test(word)) { // convert words up to 10 digits, ignore above that
      result[dialect] = pronunciationGuide(numbersToWords(word, dialect))[dialect]
      return
    } else if (initial.length && Object.keys(initialsToIPA).indexOf(initial) === -1) {
      return // result[dialect] = word // not a Vietnamese word
    } else if (Object.keys(rimesToIPA).indexOf(rime) === -1) {
      return // result[dialect] = word // not a Vietnamese word
    }

    // IPA version

    var i = (initial) ? initialsToIPA[initial][dialect].replace(/ʷ/, "") : ""
      , r = rimesToIPA[rime][dialect]

    // Add glottal stops to Hanoi output depending on the tone
    if (dialect === "hanoi" && tone === ".") {
      r += "ʔ"
    } else if (dialect === "hanoi" && tone === "~") {
      if (/ʷ/.test(r)) r = r.replace(/ʷ/, "ʷʔ")
      else if (/(.)ː/.test(r)) r = r.replace(/(.)ː/, "$1ʔ$1")
      else if (/(ŋ͡m|k͡p)$/.test(r)) r = r.replace(/(ŋ͡m|k͡p)$/, "ʔ$1")
      else r = r.slice(0, 1) + "ʔ" + r.slice(1)
    }

    var ipa = i + g + r

    if (dialect === "saigon") ipa = ipa.replace(/^[ŋhk]ʷ/, "w") // saigon merger of velar + onglide
    else if (dialect === "quangnam") ipa = ipa.replace(/^kʷ/, "w") // quangnam quy = uy

    ipa += tones[tone][dialect].replace(/[ʔ_]/gi, "").normalize()
    result[dialect].ipa = ipa

    // Zoopdog version

    var i = (initial) ? initialsToIPA[initial][dialect].replace(/ʰ/, "’")
                                                       .replace(/ʷ/, "")
                                                       .replace(/j/, "y") : ""
      , r = rimesToIPA[rime][dialect].replace(/^(.)w$/, "$1U") // may, mau -> final vowel should be treated like coda
                                     .replace(/^(.)j$/, "$1I")

    // QN & SGN simplification of onsets
    if (dialect === "saigon" && /^[ŋhk]?ʷ/.test(i + g)) { i = "W"; glide = false }
    else if (dialect === "quangnam" && /^[k]?ʷ/.test(i + g)) { i = "W"; glide = false }

    var html        = ""
      , codaMatch   = r.match(/(ŋ͡m|k͡p|[mnŋptkUI])/)
      , nucleus     = (codaMatch) ? r.substring(0, codaMatch.index) : r
      , coda        = (codaMatch !== null) ? zoopdogSymbols[codaMatch[0]] || codaMatch[0] : ""
      , vowels      = nucleus.match(/(.\u0308?\u031F?\u032F?ː?)|[jwʷ]/gi)
      , qualities   = vowels.map(v => {
                        if (/[\u032F\u0308ʷ]/.test(v)) return "glide"
                        else if (/ː/.test(v)) return "long-vowel"
                        else return "short-vowel"
                      })
      , pg          = (dialect === "hanoi" && (!i.length || /ʔ/.test(i))) ?  " preglottalized" : ""
      , longFinal   = true
      , doubleGlide = (glide && qualities[0] === "glide") // "thuy" in QN & SGN, for example

    if (i) html += `<span class='phonemic-unit consonant'>${zoopdogSymbols[i] || i}</span>`
    if (glide && !doubleGlide) html += `<span class='phonemic-unit glide'>w</span>`

    if (qualities.filter(x => x === "long-vowel").length || qualities.filter(x => x === "short-vowel").length > 1) longFinal = false

    for (z=0; z<vowels.length; z++) {
      var coreVowel = vowels[z].split(/[\u031F\u032Fː]/)[0]
        , v         = zoopdogSymbols[coreVowel] || coreVowel

      if (coreVowel === "ɤ") {
        if (i === 0 && qualities[z] !== "long-vowel") v = "ə" // exception for minor ɤ (Saigonese "-i", etc)
        else if (vowels.length > 2) v = "ə" // nuôi, nươi, etc
      }

      // glide superscript
      if (qualities[z] === "glide" && v !== "ʷ") v = `<span class="super">${v}</span>`
      // double glide
      if (z === 0 && doubleGlide) v = `w${v}`

      html += `<span class='phonemic-unit ${qualities[z]}'>${v}</span>`
    }

    if (codaMatch) {
      // special for "may", "mau"
      if (/[UI]/.test(coda)) html += `<span class='phonemic-unit long-consonant consonant'>${coda.toLowerCase()}${coda.toLowerCase()}</span>`
      else if (longFinal) html += `<span class='phonemic-unit long-consonant consonant'>${coda}</span>`
      else html += `<span class='phonemic-unit consonant'>${coda}</span>`
    }

    result[dialect].zd = `<div class='zoopdog-word${pg}' tone='${tones[tone][dialect]}'>\
                            <div class='phonemes'>${html}</div>\
                            <div class='source-word'>${word}</div>\
                            <div class='source-ipa'>${ipa}</div>\
                          </div>`

  })
  return result
}

const pronunciationGuide = (str) => {
  /* ======================================================== //
  // Given a string of words, produce IPA and HTML            //
  // pronunciation guide for a given string in each dialect.  //
  // ======================================================== */

  var sourceArray = str.normalize().toLowerCase().cleanUpNumbers().match(wordUnitsRegex)
    , outputArray = (sourceArray === null) ? [" "] : sourceArray.map(word => wordPronunciation(word))
  return outputArray.reduce(function(res, item){
    for (dialect in item) {
      res[dialect] = res[dialect] || {}
      for (style in item[dialect]) {
        res[dialect][style] = [res[dialect][style], item[dialect][style]].join(" ")
      }
    }
    return res
  }, {})
}

const getHomophones = (word, includeSelf) => {
  /* ======================================================== //
  // For each dialect, return all possible words that are     //
  // homophonous with the given word.                         //
  // ======================================================== */

  var [initial, glide, rime, tone] = dissect(word)
    , homophones = {}
    , includeSelf = includeSelf || false

  dialects.forEach(dialect => {
    homophones[dialect] = [];

    if (initial.length && Object.keys(initialsToIPA).indexOf(initial) === -1) {
      homophones[dialect].push(word) // not a Vietnamese word
    } else if (Object.keys(rimesToIPA).indexOf(rime) === -1) {
      homophones[dialect].push(word) // not a Vietnamese word
    } else {

      if (includeSelf) homophones[dialect].push(word)

      var initialPron = (initial.length) ? initialsToIPA[initial][dialect] : ""
        , rimePron    = rimesToIPA[rime][dialect]
        , homInitials = (initial.length) ? Object.keys(initialsToIPA).filter(i => initialsToIPA[i][dialect] === initialPron) : [""]
        , homRimes    = Object.keys(rimesToIPA).filter(r => rimesToIPA[r][dialect] === rimePron)
      // account for saigon merger of velar + onglide (hoang = quang = oang = ngoang)
      if (dialect === "saigon" && glide && ["ng", "qu", "h", ""].indexOf(initial) > -1) {
        homInitials = ["ng", "qu", "h", ""]
      // account for quangnam merger of /kw/ & /w/ initial (quy = uy)
      } else if (dialect === "quangnam" && glide && ["qu", ""].indexOf(initial) > -1) {
        homInitials = ["qu", ""]
      }

      for (var i of homInitials) {
        for (var r of homRimes) {
          var candidates = [];
          candidates.push(construct(i, glide, r, tone))
          if (["quangnam", "saigon"].indexOf(dialect) > -1) { // QN & SGN merger of hoi & nga tones
            if (tone === "?") candidates.push(construct(i, glide, r, "~"))
            if (tone === "~") candidates.push(construct(i, glide, r, "?"))
          }
          candidates.forEach(w => {
            if (!w) return false
            if ([word, "qui"].indexOf(w) > -1 || homophones[dialect].indexOf(w) > -1) return false
            if (allPossibleRealWords.indexOf(w) > -1) homophones[dialect].push(w)
          })
        }
      }

    }
  })
  return homophones
}

const getShortLongPairs = (word) => {
  /* ======================================================== //
  // For each dialect, return all possible words that form a  //
  // vowel-length minimal pair with a given word,             //
  // and indicate whether it is shorter or longer than        //
  // the given word.                                          //
  // ======================================================== */

  var [initial, glide, rime, tone] = dissect(word)
    , results = []
    , generated = []

  dialects.forEach(dialect => {
    results[dialect] = {shorter: [], longer: []}
    var initialPron = (initial.length) ? initialsToIPA[initial][dialect] : ""
      , rimePron    = rimesToIPA[rime][dialect]
      , isLong      = /ː/.test(rimePron)
      , homRimes    = Object.keys(rimesToIPA).filter((r) => {
          var target = rimesToIPA[r][dialect]
          if (isLong) { // if vowel is long, look for short
            var condition = target.length < rimePron.length
          } else {              // if vowel is short, look for long
            var condition = target.length > rimePron.length
          }
          return (target.replace(/ː/gi, "") === rimePron.replace(/ː/gi, "") && condition)
        })
    for (var r of homRimes) {
      var newWord = construct(initial, glide, r, tone)
      if (!newWord) continue
      if ([word, "qui"].indexOf(newWord) > -1 || generated.indexOf(newWord) > -1) continue
      if (isLong) results[dialect]["shorter"].push(newWord)
      else results[dialect]["longer"].push(newWord)
    }
  })
  return results
}

// Stolen and adapted from https://stackoverflow.com/a/33385401/4210855
const getPermutations = (array, prefix) => {
  /* ======================================================== //
  // Given an array of arrays                                 //
  // [["a"], ["b", "c", "d"], ["e", "f"]],                    //
  // return an array                                          //
  // ["a b e", "a b f", "a c e", "a c f", "a d e", "a e f"]   //
  // ======================================================== */

  prefix = prefix || ''
  if (!array.length) return prefix
  var result = array[0].reduce((result, value) => {
    return result.concat(getPermutations(array.slice(1), prefix + " " + value))
  }, [])
  return result.map((x) => x.trim()) // get rid of initial spaces
}

const howManyPossibilities = (array) => {
  if (!array.length) return 0
  return array.reduce((cur, next) => {
    return cur * next.length
  }, 1)
}

const getMultiWordHomophones = (str, limit) => {
  /* ======================================================== //
  // Given a string of words, return all possible strings of  //
  // words that would be pronounced the same in each dialect. //
  // ======================================================== */

  var sourceArray  = str.normalize().toLowerCase().match(wordUnitsRegex)
    , outputArray  = (sourceArray !== null) ? sourceArray.map(word => getHomophones(word, true)) : [" "]
    , result       = {}
  dialects.forEach((dialect) => {
    var sequence = outputArray.map(homophones => homophones[dialect])
      , total    = howManyPossibilities(sequence)
    if (total >= limit) result[dialect] = total // return a number if the total exceeds the limit
    else result[dialect] = getPermutations(sequence).filter(hp => hp !== sourceArray.join(" ")) || "&nbsp;"
  })
  return result
}
