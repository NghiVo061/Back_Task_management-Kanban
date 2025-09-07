import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { EMAIL_RULE, EMAIL_RULE_MESSAGE } from '~/utils/validators'
import { CARD_MEMBER_ACTIONS } from '~/utils/constants'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'
import { boardModel } from './boardModel'

const CARD_COLLECTION_NAME = 'cards'
const CARD_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  columnId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),

  title: Joi.string().required().min(3).max(50).trim().strict(),
  description: Joi.string().optional(),

  cover: Joi.string().default(null),
  memberIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),
  // Dữ liệu comments của Card chúng ta sẽ học cách nhúng - embedded vào bản ghi Card luôn như dưới đây:
  comments: Joi.array().items({
    userId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    userEmail: Joi.string().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
    userAvatar: Joi.string(),
    userDisplayName: Joi.string(),
    content: Joi.string(),
    // Chỗ này lưu ý vì dùng hàm $push để thêm comment nên không set default Date.now luôn giống hàm insertOne khi create được.
    commentedAt: Joi.date().timestamp()
  }).default([]),

  attachments: Joi.array().items({
    url: Joi.string().required(),
    filename: Joi.string().required(),
    uploadedAt: Joi.date().timestamp().default(Date.now) // Optional: thêm timestamp
  }).default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'boardId', 'createdAt']

const validateData = async (data) => {
  return await CARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validatedData = await validateData(data)
    const newCard = {
      ...validatedData,
      boardId: new ObjectId(validatedData.boardId),
      columnId: new ObjectId(validatedData.columnId)
    }
    const createCard = GET_DB().collection(CARD_COLLECTION_NAME).insertOne(newCard)

    return createCard
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (cardId) => {
  const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOne({
    _id: new ObjectId(cardId)
  })

  return result
}

const update = async (cardId, updatedData) => {
  try {
    Object.keys(updatedData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updatedData[fieldName]
      }
    })

    if (updatedData.columnId) updatedData.columnId = new ObjectId(updatedData.columnId)

    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      { $set: updatedData },
      { returnDocument: 'after' }
    )

    return result
  } catch (error) {
    throw new Error(error)
  }
}

const deleteManyByColumnId = async (columnId) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).deleteMany({ columnId: new ObjectId(columnId) })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const unshiftNewComment = async (cardId, commentData) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      { $push: { comments: { $each: [commentData], $position: 0 } } },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

const updateMembers = async (cardId, incomingMemberInfo) => {
  try {
    let updateCondition = {}
    if (incomingMemberInfo.action === CARD_MEMBER_ACTIONS.ADD) {
      updateCondition = { $push: { memberIds: new ObjectId(incomingMemberInfo.userId) } }
    }

    if (incomingMemberInfo.action === CARD_MEMBER_ACTIONS.REMOVE) {
      updateCondition = { $pull: { memberIds: new ObjectId(incomingMemberInfo.userId) } }
    }

    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      updateCondition,
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

const updateManyComments = async (userId, userInfo) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).updateMany(
      { 'comments.userId': userId },
      { $set: {
        'comments.$[element].userAvatar': userInfo.avatar,
        'comments.$[element].userDisplayName': userInfo.displayName
      } },
      { arrayFilters: [{ 'element.userId': userId }] }
    )

    return result
  } catch (error) { throw new Error(error) }
}

// change
const deleteOneById = async (cardId) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).deleteOne({
      _id: new ObjectId(cardId)
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

// change
const deleteComment = async (cardId, commentId, userId) => {
  try {
    const card = await findOneById(cardId)
    if (!card) {
      throw new Error('Card not found')
    }
    const comment = card.comments.find(c => c._id.toString() === commentId)
    if (!comment) {
      throw new Error('Comment not found')
    }
    const board = await boardModel.findOneById(card.boardId.toString())
    if (!board) {
      throw new Error('Board not found')
    }
    const isOwner = board.ownerIds.map(id => id.toString()).includes(userId.toString())
    const isCreator = comment.userId.toString() === userId.toString()
    if (!isCreator && !isOwner) {
      throw new Error('You are not authorized to delete this comment')
    }
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      { $pull: { comments: { _id: new ObjectId(commentId) } } },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

// change
const updateAttachments = async (cardId, attachmentsArray) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      { $push: { attachments: { $each: attachmentsArray } }, $set: { updatedAt: Date.now() } },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}
// change
const removeAttachment = async (cardId, attachmentUrl) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      { $pull: { attachments: { url: attachmentUrl } }, $set: { updatedAt: Date.now() } },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) {
    throw new Error(error)
  }
}


export const cardModel = {
  CARD_COLLECTION_NAME,
  CARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  update,
  deleteManyByColumnId,
  unshiftNewComment,
  updateMembers,
  updateManyComments,
  deleteOneById,
  deleteComment,
  updateAttachments,
  removeAttachment
}