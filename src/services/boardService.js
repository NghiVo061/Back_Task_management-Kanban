/* eslint-disable indent */
import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import { columnModel } from '~/models/columnModel'
import { cardModel } from '~/models/cardModel'
import ApiError from '~/utils/ApiError'
import { DEFAULT_PAGE, DEFAULT_ITEMS_PER_PAGE} from '~/utils/constants'
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'
import { invitationModel } from '~/models/invitationModel'

const createNew = async (userId, reqBody) => {
    try {
        const newBoard = {
            ...reqBody,
            slug: slugify(reqBody.title)
        }
        const createBoard = await boardModel.createNew(userId, newBoard)
        const getNewBoard = await boardModel.findOneById(createBoard.insertedId)

        return getNewBoard
    } catch (error) {
        throw error
    }
}


const getDetails = async (userId, boardId) => {
    try {
        const board = await boardModel.getDetails(userId, boardId)
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

        // change
        // Sắp xếp lại owners theo đúng thứ tự ownerIds (lọc trùng)
        resBoard.owners = Array.from(
          new Set(resBoard.ownerIds.map(id => id.toString()))
        ).map(id => resBoard.owners.find(u => u._id.equals(id)))

        // change
        // Sắp xếp lại members theo đúng thứ tự memberIds (lọc trùng)
        resBoard.members = Array.from(
          new Set(resBoard.memberIds.map(id => id.toString()))
        ).map(id => resBoard.members.find(u => u._id.equals(id)))

        return resBoard
    } catch (error) {
        throw error
    }
}

const moveCardToDifferentColumn = async (reqBody) => {
  try {

    // B1: Cập nhật mảng cardOrderIds của Column ban đầu chứa nó
    // (Hiểu bản chất là xóa cái _id của Card ra khỏi mảng)

    await columnModel.update(reqBody.prevColumnId, {
        cardOrderIds: reqBody.prevCardOrderIds,
        updatedAt: Date.now()
    })

    // B2: Cập nhật mảng cardOrderIds của Column tiếp theo
    // (Hiểu bản chất là thêm _id của Card vào mảng)

    await columnModel.update(reqBody.nextColumnId, {
        cardOrderIds: reqBody.nextCardOrderIds,
        updatedAt: Date.now()
    })
    // B3: Cập nhật lại trường columnId mới của cái Card đã kéo
    await cardModel.update(reqBody.currentCardId, {
        columnId: reqBody.nextColumnId
    })

    return { updateResult: 'Successfully!' }

  } catch (error) { throw error }
}

const update = async (boardId, reqBody, userId) => {
  try {
    const { incomingMemberInfo, ...updateData } = reqBody

    // Nếu user tự rời board
    if (
      incomingMemberInfo?.action === 'REMOVE' &&
      incomingMemberInfo.userId === userId
    ) {
      await boardModel.updateMembers(boardId, incomingMemberInfo)
      // Trả về thông tin đặc biệt để FE biết user đã rời
      return { _id: boardId, leftBoard: true }
    }

    // Nếu có yêu cầu xóa board (_destroy: true), kiểm tra xem userId có phải là owner không
    if (updateData._destroy) {
      const board = await boardModel.findOneById(boardId)
      if (!board) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
      }
      if (board.ownerIds.toString() !== userId) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Only the board owner can delete this board!')
      }

      // Soft delete board
      updateData.updatedAt = Date.now()
      await boardModel.update(boardId, updateData)

      // Xóa tất cả invitations liên quan đến board
      await invitationModel.deleteMany({ 'boardInvitation.boardId': boardId })

      return { _id: boardId, _destroy: true }
    }

    if (incomingMemberInfo) {
      await boardModel.updateMembers(boardId, incomingMemberInfo)
    } else {
      updateData.updatedAt = Date.now()
      await boardModel.update(boardId, updateData)
    }

    // Gọi lại service.getDetails để dữ liệu đồng bộ format
    const updatedBoard = await getDetails(userId, boardId)
    if (!updatedBoard) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found or user not authorized!')
    }

    return updatedBoard
  } catch (error) { throw error }
}

const getBoards = async (userId, page, itemsPerPage, queryFilters) => {
  try {
    // Nếu không tồn tại page hoặc itemsPerPage từ phía FE thì BE sẽ cần phải luôn gán giá trị mặc định
    if (!page) page = DEFAULT_PAGE
    if (!itemsPerPage) itemsPerPage = DEFAULT_ITEMS_PER_PAGE

    const results = await boardModel.getBoards(
      userId,
      parseInt(page, 10),
      parseInt(itemsPerPage, 10),
      queryFilters
    )

    return results
  } catch (error) { throw error }
}

export const boardService = {
    createNew,
    getDetails,
    update,
    moveCardToDifferentColumn,
    getBoards
}