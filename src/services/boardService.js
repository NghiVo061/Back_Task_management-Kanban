/* eslint-disable indent */
import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'

const createNew = async (reqBody) => {
    try {
        const newBoard = {
            ...reqBody,
            slug: slugify(reqBody.title)
        }
        const createBoard = await boardModel.createNew(newBoard)
        const getNewBoard = await boardModel.findOneById(createBoard.insertedId)

        return getNewBoard
    } catch (error) {
        throw error
    }
}


const getDetails = async (boardId) => {
    try {
        const board = await boardModel.getDetails(boardId)
        if (!board) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
        }

        // Sử dụng cloneDeep: để tạo bản sao và tùy trình cấu trúc dữ liệu trả về cho client
        const resBoard = cloneDeep(board)
        resBoard.columns.forEach(column => {
            // Tạo trường cards và gán phần tử mảng cards (gốc) vào nếu trùng columnId với column.id
            column.cards = resBoard.cards.filter(card => card.columnId.equals(column._id))
        })
        delete resBoard.cards

        return resBoard
    } catch (error) {
        throw error
    }
}

const update = async (boardId, reqBody) => {
  try {
    const updatedData = {
      ...reqBody,
      updatedAt: Date.now()
    }
    const updatedBoard = await boardModel.update(boardId, updatedData)
    return updatedBoard
  } catch (error) { throw error }
}


export const boardService = {
    createNew,
    getDetails,
    update
}