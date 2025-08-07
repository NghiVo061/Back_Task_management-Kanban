/* eslint-disable no-console */
// Kiểm tra cac input từ người dùng có hợp lệ ko
import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'

const createNew = async (req, res, next) => {
// Điều kiện
  const correctCondition = Joi.object({
    title: Joi.string().required().min(3).max(50).trim().strict(),
    description: Joi.string().required().min(3).max(256).trim().strict()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false }) // Kiểm tra input theo điều kiện đã set trên

    // Chuyển hướng cho controller: boardValidation.createNew -> boardController.createNew
    next()

    res.status(StatusCodes.CREATED).json({
      message: 'POST from Validation: API create new board'
    })
  } catch (error) {
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      errors: new Error(error).message
    })
  }
}


export const boardValidation = {
  createNew
}