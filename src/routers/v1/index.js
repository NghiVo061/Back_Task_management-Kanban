/* eslint-disable indent */
import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardRouter } from '~/routers/v1/boardRouter'
import { columnRouter } from '~/routers/v1/columnRouter'
import { cardRouter } from '~/routers/v1/cardRouter'
const Router = express.Router()


Router.use('/boards', boardRouter)
Router.use('/columns', columnRouter)
Router.use('/cards', cardRouter)
export const APIs_v1 = Router