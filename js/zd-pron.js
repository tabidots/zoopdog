const isHomophonesPage = (document.getElementsByClassName("homophones").length) ? true : false

const shrinkOut = (el) => {
  el.classList.remove("on")
  el.style.opacity = 0
  window.setTimeout(function(){
    el.style.flex = 0.000001
    el.style.width = 0
  }, 10)
  window.setTimeout(function(){ el.style.display = "none" }, 750)
}

const growIn = (el) => {
  el.classList.add("on")
  el.style.visibility = "visible"
  if (el.style.display !== "inline-block") el.style.display = "inline-block"
  window.setTimeout(function(){ el.style.flex = 1 }, 10)
  window.setTimeout(function(){ el.style.opacity = 1 }, 200)
  if (!isHomophonesPage) window.setTimeout(drawTonesAndGradients, 300) // avoid drawing errors
}

Array.from(document.getElementsByClassName("button")).forEach((button) => {
  button.addEventListener("click", function(){

    var dialect = this.getAttribute("dialect")
      , target  = document.querySelector(`.block[dialect=${dialect}]`)

    if (this.classList.contains("on")) {
      if (document.querySelectorAll(".button.on").length === 1) return true // don't let the page go blank
      this.classList.remove("on")
      shrinkOut(target)
    } else {
      this.classList.add("on")
      growIn(target)
    }
  })
})

const pronounceMe = () => {
  var input = document.getElementById("input")
  if (!input.value) {
    Array.from(document.getElementsByClassName("pron")).forEach(p => p.innerHTML = "&nbsp;")
    return true
  }

  var pronunciations = pronunciationGuide(input.value)
  dialects.forEach(dialect => {

    var zdParagraphs = pronunciations[dialect].zd.match(/.*?([\.\?!\n:;](?=(\s\1){0,10}))|.{1,}$/g)
      , zdParentDiv  = document.querySelector(`.block[dialect=${dialect}] .pron`)
    while (zdParentDiv.firstChild) zdParentDiv.removeChild(zdParentDiv.firstChild)
    zdParagraphs.forEach(paragraph => {
      var div = document.createElement("div")
      div.innerHTML = paragraph
      zdParentDiv.appendChild(div)
    })

  })
  drawTonesAndGradients()
}

const homophoneMe = () => {
  var input = document.getElementById("input")
  if (!input.value) {
    Array.from(document.getElementsByClassName("pron")).forEach(p => p.innerHTML = "&nbsp;")
    return true
  }

  var listOfHomophones = getMultiWordHomophones(input.value, 10000)
    , pronunciations   = pronunciationGuide(input.value)
  dialects.forEach(dialect => {

    var results      = listOfHomophones[dialect]
      , zdParentDiv  = document.querySelector(`.block[dialect=${dialect}] .pron`)
    while (zdParentDiv.firstChild) zdParentDiv.removeChild(zdParentDiv.firstChild)

    var total    = (typeof results === "number") ? results : results.length
      , plural   = (total === 1) ? "" : "s"
      , totalDiv = document.createElement("div")

    totalDiv.classList.add("total")
    totalDiv.innerHTML = `${total} homophone${plural}`
    zdParentDiv.appendChild(totalDiv)

    if (typeof results === "number") {
      var warning = document.createElement("div")
      warning.classList.add("warning")
      zdParentDiv.appendChild(warning)
    } else {
      var ipa = document.createElement("div")
      ipa.classList.add("ipa")
      ipa.innerHTML = pronunciations[dialect].ipa
      zdParentDiv.appendChild(ipa)
      results.forEach(homophone => {
        var p = document.createElement("p")
        p.classList.add("homophone")
        p.innerHTML = homophone
        zdParentDiv.appendChild(p)
      })
      if (!total) { // to prevent bad layout if no results
        var p = document.createElement("p")
        p.classList.add("homophone")
        p.innerHTML = "&nbsp;"
        zdParentDiv.appendChild(p)
      }
    }

  })
}

document.getElementById("input").addEventListener("input", function(){
  if (isHomophonesPage) homophoneMe()
  else pronounceMe()
})

window.onload = function() {
  document.querySelector(`.button[dialect=hanoi]`).click()
  if (isHomophonesPage) document.querySelector(`.button[dialect=saigon]`).click()
  if (isHomophonesPage) homophoneMe()
  else pronounceMe()
}
