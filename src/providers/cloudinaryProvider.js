import cloudinary from 'cloudinary'
import streamifier from 'streamifier'
import { env } from '~/config/environment'

const cloudinaryV2 = cloudinary.v2
cloudinaryV2.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
})

const streamUpload = (fileBuffer, folderName, originalName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinaryV2.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: 'auto',
        public_id: (originalName || 'file_' + Date.now()).replace(/\s/g, '_')
      },
      (err, result) => {
        if (err) {
          reject(new Error(`Cloudinary upload failed: ${err.message}`))
        } else {
          resolve(result)
        }
      }
    )
    streamifier.createReadStream(fileBuffer).pipe(stream)
  })
}

export const CloudinaryProvider = { streamUpload }