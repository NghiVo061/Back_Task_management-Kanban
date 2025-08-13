import express from 'express'
import { columnValidation } from '~/validations/columnValidation'
import { columnController } from '~/controllers/columnController'
const Router = express.Router()

Router.route('/')
  // validation -> controller
  .post(columnValidation.createNew, columnController.createNew)


export const columnRouter = Router
