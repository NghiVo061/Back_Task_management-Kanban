/* eslint-disable indent */
import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardRouter } from '~/routers/v1/boardRouter'
const Router = express.Router()

Router.get('/status', (req, res) => {
    return res.status(StatusCodes.OK).json({
        message: 'ok'
    })
})


Router.use('/boards', boardRouter)
export const APIs_v1 = Router