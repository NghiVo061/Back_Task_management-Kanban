/* eslint-disable indent */
/* eslint-disable no-trailing-spaces */
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'

const createNew = async (reqBody) => {
    try {
        const newCard = {
            ...reqBody
        }
        const createCard = await cardModel.createNew(newCard)

        const NewCard = await cardModel.findOneById(createCard.insertedId)
        
        if (NewCard) {

            await columnModel.pushCardOrderIds(NewCard)
        }
        return NewCard
    } catch (error) {
        throw error
    }
}


export const cardService = { createNew }