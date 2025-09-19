import { ObjectId } from 'mongodb'
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import { CloudinaryProvider } from '~/providers/cloudinaryProvider'
import { GET_DB } from '~/config/mongodb'

const createNew = async (reqBody) => {
  try {
    const newCard = {
      ...reqBody
    }
    const createCard = await cardModel.createNew(newCard)

    const NewCard = await cardModel.findOneById(createCard.insertedId)

    if (NewCard && NewCard.columnId) {
      await columnModel.pushCardOrderIds(NewCard)
    }
    return NewCard
  } catch (error) {
    throw error
  }
}

const update = async (cardId, reqBody, cardCoverFile, attachmentsFiles = [], userInfo) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }

    let updatedCard = {}

    if (updateData.action === 'make-subcard') {
      const { parentCardId } = updateData
      if (!parentCardId) throw new Error('Parent card ID is required')

      updatedCard = await cardModel.makeSubCard(cardId, parentCardId)
    }
    else if (cardCoverFile) {
      const uploadResult = await CloudinaryProvider.streamUpload(cardCoverFile.buffer, 'card-covers')
      updatedCard = await cardModel.update(cardId, { cover: uploadResult.secure_url })
    } else if (reqBody.removeCover) {
      updatedCard = await cardModel.update(cardId, { cover: null })
    } else if (attachmentsFiles.length > 0) {
      const attachmentsUrls = []
      for (const file of attachmentsFiles) {
        const uploadResult = await CloudinaryProvider.streamUpload(file.buffer, 'card-attachments', file.originalname)
        attachmentsUrls.push({
          url: uploadResult.secure_url,
          filename: file.originalname,
          size: file.size
        })
      }
      updatedCard = await cardModel.updateAttachments(cardId, attachmentsUrls)
    } else if (reqBody.attachmentToRemove) {
      updatedCard = await cardModel.removeAttachment(cardId, reqBody.attachmentToRemove)
    } else if (updateData.commentToAdd) {
      const commentData = {
        _id: new ObjectId(),
        ...updateData.commentToAdd,
        commentedAt: Date.now(),
        userId: userInfo._id,
        userEmail: userInfo.email
      }
      updatedCard = await cardModel.unshiftNewComment(cardId, commentData)
    } else if (updateData.incomingMemberInfo) {
      updatedCard = await cardModel.updateMembers(cardId, updateData.incomingMemberInfo)
    } else {
      updatedCard = await cardModel.update(cardId, updateData)
    }

    return updatedCard
  } catch (error) { throw error }
}

const deleteItem = async (cardId) => {
  try {
    const targetCard = await cardModel.findOneById(cardId)
    if (!targetCard) throw new Error('Card not found!')

    if (targetCard.parentCard) {
      await GET_DB().collection(cardModel.CARD_COLLECTION_NAME).updateOne(
        { _id: new ObjectId(targetCard.parentCard) },
        { $pull: { subCards: new ObjectId(cardId) }, $set: { updatedAt: Date.now() } }
      )
    }

    if (targetCard.subCards?.length > 0) {
      for (const subCard of targetCard.subCards) {
        await deleteItem(subCard._id)
      }
    }

    await cardModel.deleteOneById(cardId)

    if (targetCard.columnId) {
      await columnModel.pullCardOrderIds(targetCard)
    }

    return { deleteResult: 'Card deleted successfully!' }
  } catch (error) {
    throw error
  }
}

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