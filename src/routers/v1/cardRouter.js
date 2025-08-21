import express from 'express'
import { cardValidation } from '~/validations/cardValidation'
import { cardController } from '~/controllers/cardController'
import { authMiddleware } from '~/middlewares/authMiddleware'
const Router = express.Router()

Router.route('/')
  // validation -> controller
  .post(authMiddleware.isAuthorized, cardValidation.createNew, cardController.createNew)


export const cardRouter = Router
