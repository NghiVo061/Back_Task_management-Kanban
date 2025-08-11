/* eslint-disable no-unused-vars */
import { StatusCodes } from 'http-status-codes'
import { env } from '~/config/environment'

export const errorHandlingMiddleware = (err, req, res, next) => {
  if (!err.statusCode) err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR

  let message = err.message || StatusCodes[err.statusCode]

  if (err.name === 'ValidationError') {
    message = err.details.map(detail => detail.message).join(', ') // Xử lý lỗi Joi
  }

  const responseError = {
    statusCode: err.statusCode,
    message: message,
    ...(env.BUILD_MODE === 'dev' && { stack: err.stack })
  }


  res.status(responseError.statusCode).json(responseError)
}
