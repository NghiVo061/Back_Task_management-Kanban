import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import { columnModel } from '~/models/columnModel'
import { cardModel } from '~/models/cardModel'
import ApiError from '~/utils/ApiError'
import { DEFAULT_PAGE, DEFAULT_ITEMS_PER_PAGE } from '~/utils/constants'
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
    if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')

    const resBoard = cloneDeep(board)

    const populateSubCardsDeep = async (cards, cardId, visited = new Set()) => {
      const strId = cardId.toString()
      if (visited.has(strId)) return null
      visited.add(strId)

      let card = cards.find(c => c._id.toString() === strId)
      if (!card) return null

      card = cloneDeep(card)

      if (card.subCards?.length) {
        card.subCards = await Promise.all(
          card.subCards.map(subId => populateSubCardsDeep(cards, subId.toString(), new Set(visited)))
        )
        card.subCards = card.subCards.filter(c => c !== null)
      }

      return card
    }

    resBoard.cards = await Promise.all(
      resBoard.cards.map(card => {
        if (!card.parentCard) return populateSubCardsDeep(resBoard.cards, card._id.toString())
        return card
      })
    )
    resBoard.cards = resBoard.cards.filter(c => c !== null)

    resBoard.columns.forEach(column => {
      column.cards = resBoard.cards.filter(
        card => card.columnId && card.columnId.equals(column._id) && !card.parentCard
      )
    })
    delete resBoard.cards

    resBoard.owners = Array.from(new Set(resBoard.ownerIds.map(id => id.toString())))
      .map(id => resBoard.owners.find(u => u._id.equals(id)))

    resBoard.members = Array.from(new Set(resBoard.memberIds.map(id => id.toString())))
      .map(id => resBoard.members.find(u => u._id.equals(id)))

    return resBoard
  } catch (error) {
    throw error
  }
}

const moveCardToDifferentColumn = async (reqBody) => {
  try {
    await columnModel.update(reqBody.prevColumnId, {
      cardOrderIds: reqBody.prevCardOrderIds,
      updatedAt: Date.now()
    })

    await columnModel.update(reqBody.nextColumnId, {
      cardOrderIds: reqBody.nextCardOrderIds,
      updatedAt: Date.now()
    })

    await cardModel.update(reqBody.currentCardId, {
      columnId: reqBody.nextColumnId
    })

    return { updateResult: 'Successfully!' }
  } catch (error) {
    throw error
  }
}

const update = async (boardId, reqBody, userId) => {
  try {
    const { incomingMemberInfo, ...updateData } = reqBody

    if (
      incomingMemberInfo?.action === 'REMOVE' &&
      incomingMemberInfo.userId === userId
    ) {
      await boardModel.updateMembers(boardId, incomingMemberInfo)
      return { _id: boardId, leftBoard: true }
    }

    if (updateData._destroy) {
      const board = await boardModel.findOneById(boardId)
      if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
      if (board.ownerIds.toString() !== userId) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Only the board owner can delete this board!')
      }

      updateData.updatedAt = Date.now()
      await boardModel.update(boardId, updateData)
      await invitationModel.deleteMany({ 'boardInvitation.boardId': boardId })

      return { _id: boardId, _destroy: true }
    }

    if (incomingMemberInfo) {
      await boardModel.updateMembers(boardId, incomingMemberInfo)
    } else {
      updateData.updatedAt = Date.now()
      await boardModel.update(boardId, updateData)
    }

    const updatedBoard = await getDetails(userId, boardId)
    if (!updatedBoard) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found or user not authorized!')
    }

    return updatedBoard
  } catch (error) {
    throw error
  }
}

const getBoards = async (userId, page, itemsPerPage, queryFilters) => {
  try {
    if (!page) page = DEFAULT_PAGE
    if (!itemsPerPage) itemsPerPage = DEFAULT_ITEMS_PER_PAGE

    const results = await boardModel.getBoards(
      userId,
      parseInt(page, 10),
      parseInt(itemsPerPage, 10),
      queryFilters
    )

    return results
  } catch (error) {
    throw error
  }
}

export const boardService = {
  createNew,
  getDetails,
  update,
  moveCardToDifferentColumn,
  getBoards
}
