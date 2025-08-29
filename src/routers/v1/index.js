/* eslint-disable indent */
import express from 'express'
import { boardRouter } from '~/routers/v1/boardRouter'
import { columnRouter } from '~/routers/v1/columnRouter'
import { cardRouter } from '~/routers/v1/cardRouter'
import { userRouter } from '~/routers/v1/userRouter'
import { invitationRoute } from '~/routes/v1/invitationRoute'
const Router = express.Router()

Router.use('/boards', boardRouter)
Router.use('/columns', columnRouter)
Router.use('/cards', cardRouter)
Router.use('/users', userRouter)
Router.use('/invitations', invitationRoute)
export const APIs_v1 = Router