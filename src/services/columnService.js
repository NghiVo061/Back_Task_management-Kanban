/* eslint-disable indent */
import { columnModel } from '~/models/columnModel'
import { boardModel } from '~/models/boardModel'


const createNew = async (reqBody) => {
    try {
        const newColumn = {
            ...reqBody
        }
        const createColumn = await columnModel.createNew(newColumn)

        const NewColumn = await columnModel.findOneById(createColumn.insertedId)
        if (NewColumn) {
            // Xử lý cấu trúc data ở đây trước khi trả dữ liệu về
            NewColumn.cards = []

            // Cập nhật mảng columnOrderIds vào trong collection boards
            await boardModel.pushColumnOrderIds(NewColumn)
        }

        return NewColumn
    } catch (error) {
        throw error
    }
}

const update = async (columnId, reqBody) => {
  try {
    const updatedData = {
      ...reqBody,
      updatedAt: Date.now()
    }
    const updatedColumn = await columnModel.update(columnId, updatedData)
    return updatedColumn
  } catch (error) { throw error }
}

export const columnService = { createNew, update }