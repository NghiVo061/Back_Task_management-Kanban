import { StatusCodes } from 'http-status-codes'
import { cardService } from '~/services/cardService'

const createNew = async (req, res, next) => {
  try {
    const createdCard = await cardService.createNew(req.body)

    res.status(StatusCodes.CREATED).json(createdCard)
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const cardCoverFile = req.files?.cardCover?.[0] || null
    const attachmentsFiles = req.files?.attachments || []
    const userInfo = req.jwtDecoded
    const updatedCard = await cardService.update(cardId, req.body, cardCoverFile, attachmentsFiles, userInfo)

    res.status(StatusCodes.OK).json(updatedCard)
  } catch (error) { next(error) }
}

// change
const deleteItem = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const result = await cardService.deleteItem(cardId)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// change
const deleteComment = async (req, res, next) => {
  try {
    const cardId = req.params.cardId
    const commentId = req.params.commentId
    const userInfo = req.jwtDecoded
    const result = await cardService.deleteComment(cardId, commentId, userInfo)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const cardController = { 
  createNew,
  update,
  deleteItem,
  deleteComment
}