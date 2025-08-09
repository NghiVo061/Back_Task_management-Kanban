// Kiểm tra cac input từ người dùng có hợp lệ ko
import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    title: Joi.string().required().min(3).max(50).trim().strict(),
    description: Joi.string().required().min(3).max(256).trim().strict()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false }) // Kiểm tra input theo điều kiện đã set trên

    // Chuyển hướng cho controller: boardValidation.createNew -> boardController.createNew
    next()
  } catch (error) {
    const errorMessage = new Error(error).message // console.log check lại
    const customError = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage)
    next(customError)
  }
}

export const boardValidation = {
  createNew
}