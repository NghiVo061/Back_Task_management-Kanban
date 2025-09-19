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
  columnId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).default(null),

  title: Joi.string().required().min(3).max(50).trim().strict(),
  description: Joi.string().optional(),

  cover: Joi.string().default(null),
  memberIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),
  comments: Joi.array().items({
    userId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    userEmail: Joi.string().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
    userAvatar: Joi.string(),
    userDisplayName: Joi.string(),
    content: Joi.string(),
    commentedAt: Joi.date().timestamp()
  }).default([]),

  attachments: Joi.array().items({
    url: Joi.string().required(),
    filename: Joi.string().required(),
    uploadedAt: Joi.date().timestamp().default(Date.now)
  }).default([]),

  parentCard: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).default(null),
  subCards: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'boardId', 'createdAt']

const populateSubCards = async (cardId) => {
  const cardsArray = await GET_DB().collection(CARD_COLLECTION_NAME)
    .aggregate([
      { $match: { _id: new ObjectId(cardId) } },
      {
        $graphLookup: {
          from: CARD_COLLECTION_NAME,
          startWith: '$subCards',
          connectFromField: 'subCards',
          connectToField: '_id',
          as: 'allSubCards'
        }
      }
    ])
    .toArray()

  const rootCard = cardsArray[0]
  if (!rootCard) return null

  const idMap = {}
  rootCard.allSubCards.forEach(card => {
    idMap[card._id.toString()] = { ...card, subCards: [] }
  })

  rootCard.allSubCards.forEach(card => {
    if (card.parentCard) {
      const parent = idMap[card.parentCard.toString()]
      if (parent) parent.subCards.push(idMap[card._id.toString()])
    }
  })

  const rootSubCards = rootCard.subCards
    .map(id => idMap[id.toString()])
    .filter(Boolean)

  return { ...rootCard, subCards: rootSubCards }
}

const validateData = async (data) => {
  return await CARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validatedData = await validateData(data)
    const newCard = {
      ...validatedData,
      boardId: new ObjectId(validatedData.boardId),
      columnId: validatedData.columnId ? new ObjectId(validatedData.columnId) : null
    }
    const createCard = await GET_DB().collection(CARD_COLLECTION_NAME).insertOne(newCard)

    return createCard
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (cardId) => {
  try {
    const populatedCard = await populateSubCards(cardId)
    return populatedCard
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (cardId, updatedData) => {
  try {
    Object.keys(updatedData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updatedData[fieldName]
      }
    })

    if (updatedData.columnId) updatedData.columnId = new ObjectId(updatedData.columnId)

    await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      { $set: updatedData },
      { returnDocument: 'after' }
    )

    const populatedCard = await populateSubCards(cardId)
    return populatedCard
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
    await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      { $push: { comments: { $each: [commentData], $position: 0 } } },
      { returnDocument: 'after' }
    )

    const populatedCard = await populateSubCards(cardId)
    return populatedCard
  } catch (error) {
    throw new Error(error)
  }
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

    await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      updateCondition,
      { returnDocument: 'after' }
    )

    const populatedCard = await populateSubCards(cardId)
    return populatedCard
  } catch (error) {
    throw new Error(error)
  }
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
  } catch (error) {
    throw new Error(error)
  }
}

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
    await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      { $pull: { comments: { _id: new ObjectId(commentId) } } },
      { returnDocument: 'after' }
    )

    const populatedCard = await populateSubCards(cardId)
    return populatedCard
  } catch (error) {
    throw new Error(error)
  }
}

const updateAttachments = async (cardId, attachmentsArray) => {
  try {
    await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      { $push: { attachments: { $each: attachmentsArray } }, $set: { updatedAt: Date.now() } },
      { returnDocument: 'after' }
    )

    const populatedCard = await populateSubCards(cardId)
    return populatedCard
  } catch (error) {
    throw new Error(error)
  }
}

const removeAttachment = async (cardId, attachmentUrl) => {
  try {
    await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      { $pull: { attachments: { url: attachmentUrl } }, $set: { updatedAt: Date.now() } },
      { returnDocument: 'after' }
    )

    const populatedCard = await populateSubCards(cardId)
    return populatedCard
  } catch (error) {
    throw new Error(error)
  }
}

const makeSubCard = async (childCardId, parentCardId) => {
  try {
    const parentCard = await findOneById(parentCardId)
    if (!parentCard) throw new Error('Parent card not found')
    const childCard = await findOneById(childCardId)
    if (!childCard) throw new Error('Child card not found')

    if (childCard.boardId.toString() !== parentCard.boardId.toString()) {
      throw new Error('Parent and child cards must belong to the same board')
    }

    await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(childCardId) },
      { $set: { parentCard: new ObjectId(parentCardId), columnId: null, updatedAt: Date.now() } },
      { returnDocument: 'after' }
    )

    await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(parentCardId) },
      { $push: { subCards: new ObjectId(childCardId) }, $set: { updatedAt: Date.now() } },
      { returnDocument: 'after' }
    )

    const populatedCard = await populateSubCards(childCardId)
    return populatedCard
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
  removeAttachment,
  makeSubCard
}