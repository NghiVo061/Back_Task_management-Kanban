import express from 'express'
import { cardValidation } from '~/validations/cardValidation'
import { cardController } from '~/controllers/cardController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddleware'
const Router = express.Router()

Router.route('/')
  .post(authMiddleware.isAuthorized, cardValidation.createNew, cardController.createNew)

Router.route('/:id')
  .put(
    authMiddleware.isAuthorized,
    multerUploadMiddleware.upload.fields([
      { name: 'cardCover', maxCount: 1 },
      { name: 'attachments', maxCount: 10 }
    ]),
    cardValidation.update,
    cardController.update
  )
  .delete(
    authMiddleware.isAuthorized,
    cardValidation.deleteItem,
    cardController.deleteItem
  )

Router.route('/:cardId/comments/:commentId')
  .delete(
    authMiddleware.isAuthorized,
    cardValidation.deleteComment,
    cardController.deleteComment
  )

export const cardRouter = Router
