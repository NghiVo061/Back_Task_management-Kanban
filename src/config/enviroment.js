import 'dotenv/config'

export const env = {
  PORT : process.env.PORT,
  HOST_NAME : process.env.HOST_NAME,
  MONGODB_URI : process.env.MONGODB_URI,
  DATABASE_NAME: process.env.DATABASE_NAME,
  BUILD_MODE : process.env.BUILD_MODE
}