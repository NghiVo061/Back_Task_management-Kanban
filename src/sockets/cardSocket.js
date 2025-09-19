export const cardSocket = (io, socket) => {
  const { boardService } = require('~/services/boardService')
  const { cardModel } = require('~/models/cardModel')

  socket.on('FE_CARD_MOVED', async ({ boardId, currentCardId, prevColumnId, prevCardOrderIds, nextColumnId, nextCardOrderIds }) => {
    try {
      const cardData = await cardModel.findOneById(currentCardId)
      if (!cardData) {
        throw new Error('Card not found')
      }

      await boardService.moveCardToDifferentColumn({
        currentCardId,
        prevColumnId,
        prevCardOrderIds,
        nextColumnId,
        nextCardOrderIds
      })

      socket.to(`board:${boardId}`).emit('BE_CARD_MOVED', {
        boardId,
        currentCardId,
        prevColumnId,
        prevCardOrderIds,
        nextColumnId,
        nextCardOrderIds,
        cardData,
        actor: socket.id
      })
    } catch (error) {
      socket.emit('BE_ERROR', { message: 'Failed to move card' })
    }
  })

  socket.on('FE_CARD_MOVED_IN_COLUMN', ({ boardId, columnId, cardOrderIds }) => {
    const { columnModel } = require('~/models/columnModel')

    columnModel.update(columnId, { cardOrderIds }).then(() => {
      socket.to(`board:${boardId}`).emit('BE_CARD_MOVED_IN_COLUMN', {
        boardId,
        columnId,
        cardOrderIds,
        actor: socket.id
      })
    }).catch(() => {
      socket.emit('BE_ERROR', { message: 'Failed to move card in column' })
    })
  })

  socket.on('FE_CARD_CREATED', (data) => {
    try {
      const { boardId, createdCard } = data

      socket.broadcast.to(`board:${boardId}`).emit('BE_CARD_CREATED', {
        boardId,
        createdCard,
        actor: socket.id,
        boardVersion: Date.now()
      })
    } catch (error) {
      console.error('Error handling FE_CARD_CREATED:', error)
    }
  })

  socket.on('FE_CARD_UPDATED', async ({ boardId, cardId, columnId, newTitle }) => {
    try {
      const card = await cardModel.findOneById(cardId)
      if (!card) throw new Error('Card not found')

      socket.broadcast.to(`board:${boardId}`).emit('BE_CARD_UPDATED', {
        boardId,
        cardId,
        columnId,
        newTitle,
        parentCardId: card.parentCardId || null,
        actor: socket.id,
        boardVersion: Date.now()
      })
    } catch (error) {
      socket.emit('BE_ERROR', { message: 'Failed to update card title' })
    }
  })

  socket.on('FE_CARD_DELETED', ({ boardId, columnId, cardId }) => {
    try {
      socket.broadcast.to(`board:${boardId}`).emit('BE_CARD_DELETED', {
        boardId,
        columnId,
        cardId,
        actor: socket.id,
        boardVersion: Date.now()
      })
    } catch (error) {
      socket.emit('BE_ERROR', { message: 'Failed to delete card' })
    }
  })

  socket.on('FE_COMMENT_ADDED', async ({ boardId, cardId, comment }) => {
    try {
      const card = await cardModel.findOneById(cardId)
      if (!card) {
        throw new Error('Card not found')
      }

      socket.broadcast.to(`board:${boardId}`).emit('BE_COMMENT_ADDED', {
        boardId,
        columnId: card.columnId,
        cardId,
        comment,
        parentCardId: card.parentCardId || null,
        actor: socket.id,
        boardVersion: Date.now()
      })
    } catch (error) {
      socket.emit('BE_ERROR', { message: 'Failed to add comment' })
    }
  })

  socket.on('FE_COMMENT_DELETED', async ({ boardId, cardId, commentId }) => {
    try {
      const card = await cardModel.findOneById(cardId)
      if (!card) {
        throw new Error('Card not found')
      }
      socket.broadcast.to(`board:${boardId}`).emit('BE_COMMENT_DELETED', {
        boardId,
        columnId: card.columnId,
        cardId,
        commentId,
        parentCardId: card.parentCardId || null,
        actor: socket.id,
        boardVersion: Date.now()
      })
    } catch (error) {
      socket.emit('BE_ERROR', { message: 'Failed to delete comment' })
    }
  })

  socket.on('FE_ATTACHMENT_ADDED', async ({ boardId, cardId, attachments }) => {
    try {
      const card = await cardModel.findOneById(cardId)
      if (!card) {
        throw new Error('Card not found')
      }

      socket.broadcast.to(`board:${boardId}`).emit('BE_ATTACHMENT_ADDED', {
        boardId,
        columnId: card.columnId,
        cardId,
        attachments,
        parentCardId: card.parentCardId || null,
        actor: socket.id,
        boardVersion: Date.now()
      })
    } catch (error) {
      socket.emit('BE_ERROR', { message: 'Failed to add attachment' })
    }
  })

  socket.on('FE_ATTACHMENT_DELETED', async ({ boardId, cardId, attachmentUrl }) => {
    try {
      const card = await cardModel.findOneById(cardId)
      if (!card) {
        throw new Error('Card not found')
      }

      socket.broadcast.to(`board:${boardId}`).emit('BE_ATTACHMENT_DELETED', {
        boardId,
        columnId: card.columnId,
        cardId,
        attachmentUrl,
        parentCardId: card.parentCardId || null,
        actor: socket.id,
        boardVersion: Date.now()
      })

    } catch (error) {
      socket.emit('BE_ERROR', { message: 'Failed to delete attachment' })
    }
  })

  socket.on('FE_CARD_COVER_ADDED', async ({ boardId, cardId, cover }) => {
    try {
      const card = await cardModel.findOneById(cardId)
      if (!card) {
        throw new Error('Card not found')
      }

      socket.broadcast.to(`board:${boardId}`).emit('BE_CARD_COVER_ADDED', {
        boardId,
        columnId: card.columnId,
        cardId,
        cover,
        parentCardId: card.parentCardId || null,
        actor: socket.id,
        boardVersion: Date.now()
      })

    } catch (error) {
      socket.emit('BE_ERROR', { message: 'Failed to add card cover' })
    }
  })

  socket.on('FE_CARD_COVER_REMOVED', async ({ boardId, cardId }) => {
    try {
      const card = await cardModel.findOneById(cardId)
      if (!card) {
        throw new Error('Card not found')
      }

      socket.broadcast.to(`board:${boardId}`).emit('BE_CARD_COVER_REMOVED', {
        boardId,
        columnId: card.columnId,
        cardId,
        parentCardId: card.parentCardId || null,
        actor: socket.id,
        boardVersion: Date.now()
      })

    } catch (error) {
      socket.emit('BE_ERROR', { message: 'Failed to remove card cover' })
    }
  })

  socket.on('FE_CARD_MEMBERS_UPDATED', async ({ boardId, cardId, memberIds }) => {
    try {
      const card = await cardModel.findOneById(cardId)
      if (!card) throw new Error('Card not found')

      socket.broadcast.to(`board:${boardId}`).emit('BE_CARD_MEMBERS_UPDATED', {
        boardId,
        columnId: card.columnId,
        cardId,
        memberIds,
        parentCardId: card.parentCardId || null,
        actor: socket.id,
        boardVersion: Date.now()
      })
    } catch (error) {
      socket.emit('BE_ERROR', { message: 'Failed to update card members' })
    }
  })

  socket.on('FE_CARD_DESCRIPTION_UPDATED', async ({ boardId, cardId, columnId, newDescription }) => {
    try {
      const card = await cardModel.findOneById(cardId)
      if (!card) {
        throw new Error('Card not found')
      }
      socket.broadcast.to(`board:${boardId}`).emit('BE_CARD_DESCRIPTION_UPDATED', {
        boardId,
        cardId,
        columnId,
        newDescription,
        parentCardId: card.parentCardId || null,
        actor: socket.id,
        boardVersion: Date.now()
      })
    } catch (error) {
      socket.emit('BE_ERROR', { message: 'Failed to update card description' })
    }
  })

  socket.on('FE_CARD_MADE_SUBCARD', async ({ boardId, childCardId, parentCardId }) => {
    try {
      const { cardModel } = require('~/models/cardModel')

      const childCard = await cardModel.findOneById(childCardId)
      const parentCard = await cardModel.findOneById(parentCardId)

      if (!childCard || !parentCard) {
        throw new Error('Child or parent card not found')
      }

      await cardModel.update(childCardId, { parentCardId })

      socket.broadcast.to(`board:${boardId}`).emit('BE_CARD_MADE_SUBCARD', {
        boardId,
        childCardId,
        parentCardId,
        cardData: childCard,
        actor: socket.id,
        boardVersion: Date.now()
      })

    } catch (error) {
      console.error('Error handling FE_CARD_MADE_SUBCARD:', error)
      socket.emit('BE_ERROR', { message: 'Failed to create sub-card' })
    }
  })

  socket.on('FE_SUBCARD_DELETED', async ({ boardId, columnId, cardId, parentCardId, actor }) => {
    try {
      const { cardModel } = require('~/models/cardModel')

      if (!parentCardId) throw new Error('Parent card ID is required')

      const parentCard = await cardModel.findOneById(parentCardId)
      if (!parentCard) throw new Error('Parent card not found')

      socket.broadcast.to(`board:${boardId}`).emit('BE_SUBCARD_DELETED', {
        boardId,
        columnId,
        cardId,
        parentCardId,
        actor,
        boardVersion: Date.now()
      })
    } catch (error) {
      console.error('Error in FE_SUBCARD_DELETED:', error)
      socket.emit('BE_ERROR', { message: 'Failed to delete sub-card' })
    }
  })
}