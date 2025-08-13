/* eslint-disable indent */
import { columnModel } from '~/models/columnModel'
import { boardModel } from '~/models/boardModel'


const createNew = async (reqBody) => {
    try {
        const newColumn = {
            ...reqBody
        }
        const createColumn = await columnModel.createNew(newColumn)

        const getNewColumn = await columnModel.findOneById(createColumn.insertedId)
        if (getNewColumn) {
            // Xử lý cấu trúc data ở đây trước khi trả dữ liệu về
            getNewColumn.cards = []

            // Cập nhật mảng columnOrderIds vào trong collection boards
            await boardModel.pushColumnOrderIds(getNewColumn)
        }

        return getNewColumn
    } catch (error) {
        throw error
    }
}


export const columnService = { createNew }