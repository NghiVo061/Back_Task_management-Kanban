/* eslint-disable indent */
/* eslint-disable no-useless-catch */
import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
const createNew = async (reqBody) => {
    try {
        const newBoard = {
            ...reqBody,
            slug: slugify(reqBody.title)
        }
        const createBoard = await boardModel.createNew(newBoard)

        const getNewBoard = await boardModel.findOneById(createBoard.insertedId)
    
        console.log('>>>Service: ', getNewBoard)

        return getNewBoard
    } catch (error) {
        throw error
    }
}

export const boardService = { createNew }