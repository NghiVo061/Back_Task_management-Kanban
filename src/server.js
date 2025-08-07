/* eslint-disable no-trailing-spaces */
/* eslint-disable no-console */
import express from 'express'
import { CONNECT_DB, GET_DB, CLOSE_DB } from '~/config/mongodb'
import { APIs_v1 } from '~/routers/v1/index'
import exitHook from 'async-exit-hook'
import { env } from '~/config/enviroment'


const START_SERVER = () => {
  const app = express()
  const port = env.PORT || 8888
  const hostName = env.HOST_NAME
  
  app.use(express.json())

  // call router index
  app.use('/v1', APIs_v1)

  app.get('/', (req, res) => {
    res.send('Hello World!')
  })
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

  //Cơ chế gọi close connection
  exitHook(async () => {
    try {
      await CLOSE_DB();
    } catch (error) {
      console.error('Error closing database:', error)
    }
  })
}

(async () => {
  try {
    console.log('1. Connecting to MongoDB Cloud Atlas...')
    await CONNECT_DB();
    console.log('2. Connected to MongoDB Cloud Atlas!')

    START_SERVER()
  } catch (error) {
    console.error(error)
    process.exit(0)
  }
})()


// CONNECT_DB()
//   .then(() => console.log('Connected to MongoDB Cloud Atlas!'))
//   .then(() => START_SERVER())
//   .catch(error => {
//     console.error(error)
//     process.exit(0)
// })
