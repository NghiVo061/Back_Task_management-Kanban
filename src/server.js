import express from 'express'
import cors from 'cors'
import { corsOptions } from '~/config/cors'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import { APIs_v1 } from '~/routers/v1/index'
import exitHook from 'async-exit-hook'
import { env } from '~/config/environment'
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware'
import { inviteUserToBoardSocket } from '~/sockets/inviteUserToBoardSocket'
import cookieParser from 'cookie-parser'
import http from 'http'
import socketIo from 'socket.io'

import { columnSocket } from '~/sockets/columnSocket'
import { cardSocket } from '~/sockets/cardSocket'
import boardSocket from './sockets/boardSocket'
import userSocket from './sockets/userSocket'

const START_SERVER = () => {
  const app = express()
  const port = env.PORT || 8888

  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  app.use(cookieParser())
  app.use(cors(corsOptions))

  app.use(express.json())

  app.use('/v1', APIs_v1)

  app.get('/', (req, res) => {
    res.send('Hello World!')
  })

  app.use(errorHandlingMiddleware)

  const server = http.createServer(app)
  const io = socketIo(server, { cors: corsOptions })
  io.on('connection', (socket) => {
    socket.on('FE_JOIN_BOARD', (boardId) => {
      socket.join(`board:${boardId}`)
    })
  
    inviteUserToBoardSocket(io, socket)
    columnSocket(io, socket)
    cardSocket(io, socket)
    boardSocket(io, socket)
    userSocket(io, socket)
  })
  server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

  exitHook(async () => {
    try {
      await CLOSE_DB()
    } catch (error) {
      console.error('Error closing database:', error)
    }
  })
}

(async () => {
  try {
    console.log('1. Connecting to MongoDB Cloud Atlas...')
    await CONNECT_DB()
    console.log('2. Connected to MongoDB Cloud Atlas!')

    START_SERVER()
  } catch (error) {
    console.error(error)
    process.exit(0)
  }
})()