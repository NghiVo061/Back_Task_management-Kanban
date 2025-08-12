import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { BOARD_TYPES } from '~/utils/constants'
import { GET_DB } from '~/config/mongodb'
import { columnModel } from '~/models/columnModel'
import { cardModel } from '~/models/cardModel'
const BOARD_COLLECTION_NAME = 'boards'

const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required().min(3).max(50).trim().strict(),
  slug: Joi.string().required().min(3).trim().strict(),
  description: Joi.string().required().min(3).max(256).trim().strict(),
  type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required(),

  columnOrderIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const validateData = async (data) => {
  return await BOARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validatedData = await validateData(data)

    const createBoard = GET_DB().collection(BOARD_COLLECTION_NAME).insertOne(validatedData)

    return createBoard
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOne({
    _id: new ObjectId(id)
  })

  return result
}

const getDetails = async (id) => {
  const result = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate([
    { $match: {
      _id: new ObjectId(id),
      _destroy: false
    } },
    { $lookup: {
      from: columnModel.COLUMN_COLLECTION_NAME,
      localField: '_id', // Primary key
      foreignField: 'boardId', // Foreign key
      as: 'columns' // output name
    } },
    { $lookup: {
      from: cardModel.CARD_COLLECTION_NAME,
      localField: '_id',
      foreignField: 'boardId',
      as: 'cards'
    } }
  ]).toArray()
  return result[0] || null
}
export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getDetails
}