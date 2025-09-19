import { MongoClient, ServerApiVersion } from 'mongodb'
import { env } from '~/config/environment'

const MongoDB_Uri = env.MONGODB_URI
const DataBase_Name = env.DATABASE_NAME


let TMDatabaseInstance = null

const MongoClientInstance = new MongoClient(MongoDB_Uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

const CONNECT_DB = async () => {
  await MongoClientInstance.connect()
  TMDatabaseInstance = MongoClientInstance.db(DataBase_Name)
}

const GET_DB = () => {
  if (!TMDatabaseInstance) throw new Error('Must connect Database first')
  return TMDatabaseInstance
}

const CLOSE_DB = async () => {
  await MongoClientInstance.close()
}

module.exports = { CONNECT_DB, GET_DB, CLOSE_DB }
