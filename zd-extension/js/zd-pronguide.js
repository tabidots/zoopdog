// https://stackoverflow.com/a/39494245/4210855
const doScrolling = (elementY, duration) => {
  var startingY = window.pageYOffset
    , diff      = elementY - startingY
    , start
  // Bootstrap our animation - it will get called right before next frame shall be rendered.
  window.requestAnimationFrame(function step(timestamp) {
    if (!start) start = timestamp
    var time = timestamp - start                // Elapsed miliseconds since start of scrolling.
    var percent = Math.min(time / duration, 1)  // Get percent of completion in range [0, 1].
    window.scrollTo(0, startingY + diff * percent)
    // Proceed with animation as long as we wanted it to.
    if (time < duration) window.requestAnimationFrame(step)
  })
}

Array.from(document.querySelectorAll("a[href^='#']")).forEach(anchor => {
  anchor.addEventListener('click', function(e){
    Array.from(document.querySelectorAll("a[href^='#']")).forEach(a => {
      a.classList.remove("active")
    })
    e.preventDefault()
    var heading = this.getAttribute("href").slice(1)
      , target  = (heading === "consonants") ? 0 : document.getElementById(heading).offsetTop - 30
    doScrolling(target, 100)
    location.hash = `#${heading}`
    anchor.classList.add("active")
  })
})

Array.from(document.querySelectorAll("span[audio]")).forEach(phoneme => {
  var url   = phoneme.getAttribute("audio")
    , audio = document.createElement("audio")
  audio.setAttribute("src", url)
  document.body.appendChild(audio)
  phoneme.addEventListener("click", function(){
    Array.from(document.querySelectorAll("audio")).forEach(a => a.pause())
    audio.currentTime = 0
    audio.play()
  })
})

window.onload = function(){
  if (location.hash) document.querySelector(`a[href='${location.hash}']`).classList.add("active")
  else document.querySelector(`a[href='#consonants']`).classList.add("active")

  Array.from(document.querySelectorAll("dt.zd")).forEach(example => {
    var source = example.innerHTML
    if (!source) return true
    if (example.classList.contains("saigon")) example.innerHTML = pronunciationGuide(source).saigon.zd
    else example.innerHTML = pronunciationGuide(source).hanoi.zd
  })
  Array.from(document.querySelectorAll("dt.zd.toneless .zoopdog-word")).forEach(word => { word.setAttribute("tone", "") })
  drawTonesAndGradients()
}
