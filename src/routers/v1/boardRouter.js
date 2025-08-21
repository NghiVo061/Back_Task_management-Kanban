import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardValidation } from '~/validations/boardValidation'
import { boardController } from '~/controllers/boardController'
import { authMiddleware } from '~/middlewares/authMiddleware'
const Router = express.Router()

Router.route('/')
  .get( authMiddleware.isAuthorized, (req, res) => {
    res.status(StatusCodes.OK).json({ message: 'GET: API get list boards' })
  })

  // validation -> controller
  .post( authMiddleware.isAuthorized, boardValidation.createNew, boardController.createNew)

Router.route('/:id')
  .get( authMiddleware.isAuthorized, boardController.getDetails)
  .put( authMiddleware.isAuthorized, boardValidation.update, boardController.update)

// Api di chuyển card sang 1 cột khác trong board
Router.route('/supports/moving_card')
  .put( authMiddleware.isAuthorized, boardValidation.moveCardToDifferentColumn, boardController.moveCardToDifferentColumn)

export const boardRouter = Router
