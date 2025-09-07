import multer from 'multer'
import { LIMIT_COMMON_FILE_SIZE, ALLOW_IMAGE_FILE_TYPES, ALLOW_ATTACHMENT_FILE_TYPES } from '~/utils/validators'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'cardCover') {
    if (!ALLOW_IMAGE_FILE_TYPES.includes(file.mimetype)) {
      return cb(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'Only image files are allowed for cover!'), false)
    }
  } else if (file.fieldname === 'avatar') {
    if (!ALLOW_IMAGE_FILE_TYPES.includes(file.mimetype)) {
      return cb(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'Only image files are allowed for avatar!'), false)
    }
  } else if (file.fieldname === 'attachments') {
    if (!ALLOW_ATTACHMENT_FILE_TYPES.includes(file.mimetype)) {
      return cb(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, 'File type not allowed for attachment!'), false)
    }
  } else {
    return cb(null, false) // bỏ qua các field khác
  }
  cb(null, true)
}

export const multerUploadMiddleware = {
  upload: multer({
    limits: { fileSize: LIMIT_COMMON_FILE_SIZE },
    fileFilter
  })
}
