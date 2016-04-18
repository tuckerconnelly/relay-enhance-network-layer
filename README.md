Relay WebSockets Network Layer
==========
A WebSockets network layer for Relay

## Usage

startWS.js
```
import Relay from 'react-relay'
import Cookies from 'js-cookie'
import RelayWebSocketNetworkLayer from 'relay-web-sockets'

export default new Promise(resolve => {
  const ws = new WebSocket('wss:domain.dev:8443')

  ws.addEventListener('open', () => {
    Relay.injectNetworkLayer(new RelayWebSocketNetworkLayer(ws, {
      sid: Cookies.get('sid'),
    }))
    resolve()
  })
})
```

index.web.js
```
import React from 'react'
import { render } from 'react-dom'

import startWS from './startWS'
import App from './src/index'

startWS.then(() =>
  render(<App />, document.getElementById('root'))
)
```

server.js
```
// Uses redis to store sessions, could be anything
// Don't even need sessions, just put them here to
// show a real-world example with authentication
import { graphql } from 'graphql'
import WebSocket from 'ws'
import Redis from 'ioredis'

import Schema from './Schema/index'

// server from node http, koa, express, or whatever.

const wss = new WebSocket.Server({ server })
const redis = new Redis()
wss.on('connection', ws => {
  ws.on('message', message => {
    (async function () {
      const { messageID, queries, sid } = JSON.parse(message)

      const session = await new Promise((resolve, reject) => {
        redis.get(sid, (err, result) => {
          if (err) return reject(err)
          return resolve(JSON.parse(result))
        })
      })

      if (!session.authenticated) {
        ws.send(JSON.stringify({
          messageID,
          error: 'Unauthed',
        }))
        return
      }

      Promise.all(
        queries.map(query => graphql(Schema, query))
      )
      .then(results => {
        ws.send(JSON.stringify({
          messageID,
          results,
        }))
        done()
      })
    }())
  })
})
```

It's important to send back the messageID so relay knows
what message is the response to the request.

## License
MIT
