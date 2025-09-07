import { ObjectId } from 'mongodb'
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import { CloudinaryProvider } from '~/providers/cloudinaryProvider'

const createNew = async (reqBody) => {
  try {
    const newCard = {
      ...reqBody
    }
    const createCard = await cardModel.createNew(newCard)

    const NewCard = await cardModel.findOneById(createCard.insertedId)

    if (NewCard) {

      await columnModel.pushCardOrderIds(NewCard)
    }
    return NewCard
  } catch (error) {
    throw error
  }
}

// change
const update = async (cardId, reqBody, cardCoverFile, attachmentsFiles = [], userInfo) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }

    let updatedCard = {}

    if (cardCoverFile) {
      const uploadResult = await CloudinaryProvider.streamUpload(cardCoverFile.buffer, 'card-covers')
      updatedCard = await cardModel.update(cardId, { cover: uploadResult.secure_url })
    } else if (reqBody.removeCover) {
      // Xóa cover bằng cách set cover thành null hoặc chuỗi rỗng
      updatedCard = await cardModel.update(cardId, { cover: null })
    } else if (attachmentsFiles.length > 0) {
      const attachmentsUrls = []
      for (const file of attachmentsFiles) {
        const uploadResult = await CloudinaryProvider.streamUpload(file.buffer, 'card-attachments', file.originalname)
        attachmentsUrls.push({
          url: uploadResult.secure_url,
          filename: file.originalname,
          size: file.size // Lấy size từ Multer file object
        })
      }
      updatedCard = await cardModel.updateAttachments(cardId, attachmentsUrls)
    } else if (reqBody.attachmentToRemove) {
      updatedCard = await cardModel.removeAttachment(cardId, reqBody.attachmentToRemove)
    } else if (updateData.commentToAdd) {
      const commentData = {
        _id: new ObjectId(),
        ...updateData.commentToAdd, // content, display name, avatar
        commentedAt: Date.now(),
        userId: userInfo._id,
        userEmail: userInfo.email
      }
      updatedCard = await cardModel.unshiftNewComment(cardId, commentData) // unshift: đẩy phần tử lên đầu mảng
    } else if (updateData.incomingMemberInfo) {
      // Trường hợp ADD hoặc REMOVE thành viên ra khỏi Card
      updatedCard = await cardModel.updateMembers(cardId, updateData.incomingMemberInfo)
    } else {
      // Các trường hợp update chung như title, description
      updatedCard = await cardModel.update(cardId, updateData)
    }


    return updatedCard
  } catch (error) { throw error }
}

// change
const deleteItem = async (cardId) => {
  try {
    // Lấy thông tin card trước khi xóa để có columnId
    const targetCard = await cardModel.findOneById(cardId)
    if (!targetCard) {
      throw new Error('Card not found!')
    }

    // Xóa card
    await cardModel.deleteOneById(cardId)

    // Cập nhật cardOrderIds trong column (xóa cardId khỏi mảng)
    await columnModel.pullCardOrderIds(targetCard)

    return { deleteResult: 'Card deleted successfully!' }
  } catch (error) {
    throw error
  }
}

// change
const deleteComment = async (cardId, commentId, userInfo) => {
  try {
    const updatedCard = await cardModel.deleteComment(cardId, commentId, userInfo._id)
    return updatedCard
  } catch (error) {
    throw error
  }
}

export const cardService = {
  createNew,
  update,
  deleteItem,
  deleteComment
}