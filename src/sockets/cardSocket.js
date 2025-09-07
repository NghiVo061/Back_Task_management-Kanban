export const cardSocket = (io, socket) => {
  const { boardService } = require('~/services/boardService')
  const { cardModel } = require('~/models/cardModel')

  // Kéo thả card giữa các cột
  socket.on('FE_CARD_MOVED', async ({ boardId, currentCardId, prevColumnId, prevCardOrderIds, nextColumnId, nextCardOrderIds }) => {
    try {
      // Lấy dữ liệu đầy đủ của card
      const cardData = await cardModel.findOneById(currentCardId)
      if (!cardData) {
        throw new Error('Card not found')
      }

      // Cập nhật dữ liệu trong database
      await boardService.moveCardToDifferentColumn({
        currentCardId,
        prevColumnId,
        prevCardOrderIds,
        nextColumnId,
        nextCardOrderIds
      })

      // Phát sự kiện đến tất cả client trong board, trừ người gửi
      socket.to(`board:${boardId}`).emit('BE_CARD_MOVED', {
        boardId,
        currentCardId,
        prevColumnId,
        prevCardOrderIds,
        nextColumnId,
        nextCardOrderIds,
        cardData, // Gửi dữ liệu đầy đủ của card
        actor: socket.id
      })
    } catch (error) {
      socket.emit('BE_ERROR', { message: 'Failed to move card' })
    }
  })

  // Kéo thả card trong cùng cột
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

      // Broadcast đến tất cả client khác trong room board
      socket.broadcast.to(`board:${boardId}`).emit('BE_CARD_CREATED', {
        boardId,
        createdCard,
        actor: socket.id,
        boardVersion: Date.now() // Optional: Để track version nếu cần
      })
    } catch (error) {
      console.error('Error handling FE_CARD_CREATED:', error)
    }
  })

  socket.on('FE_CARD_UPDATED', async ({ boardId, cardId, columnId, newTitle }) => {
    try {
      socket.broadcast.to(`board:${boardId}`).emit('BE_CARD_UPDATED', {
        boardId,
        cardId,
        columnId,
        newTitle,
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

      // Broadcast cho các client khác trong board
      socket.broadcast.to(`board:${boardId}`).emit('BE_COMMENT_ADDED', {
        boardId,
        columnId: card.columnId,
        cardId,
        comment, // gửi luôn comment vừa thêm (BE có thể enrich thêm nếu cần)
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
        attachments, // Gửi attachments mới
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
        attachmentUrl, // Gửi attachmentUrl để xóa
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
        cover, // Gửi URL của cover mới
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
        actor: socket.id,
        boardVersion: Date.now()
      })
    } catch (error) {
      socket.emit('BE_ERROR', { message: 'Failed to update card members' })
    }
  })


}