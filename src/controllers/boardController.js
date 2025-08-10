import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { boardService } from '~/services/boardService'
const createNew = async (req, res, next) => {
  try {
    const createdBoard = await boardService.createNew(req.body)

    console.log('>>>Controller', createdBoard)
    res.status(StatusCodes.CREATED).json(createdBoard)
  } catch (error) {
    // Chuyển lỗi sang middleware (server)
    next(error)
  }
}

export const boardController = { createNew }