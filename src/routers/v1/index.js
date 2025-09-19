import express from 'express'
import { boardRouter } from '~/routers/v1/boardRouter'
import { columnRouter } from '~/routers/v1/columnRouter'
import { cardRouter } from '~/routers/v1/cardRouter'
import { userRouter } from '~/routers/v1/userRouter'
import { invitationRouter } from '~/routers/v1/invitationRouter'
const Router = express.Router()

Router.use('/boards', boardRouter)
Router.use('/columns', columnRouter)
Router.use('/cards', cardRouter)
Router.use('/users', userRouter)
Router.use('/invitations', invitationRouter)
export const APIs_v1 = Router