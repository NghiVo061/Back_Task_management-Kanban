// sockets/columnSocket.js
import { boardModel } from '~/models/boardModel'

export const columnSocket = (io, socket) => {
  socket.on('FE_COLUMN_MOVED', async (data) => {
    try {
      const { boardId, columnOrderIds } = data

      // Cập nhật DB
      await boardModel.update(boardId, { columnOrderIds })

      // Broadcast cho tất cả client trong cùng board
      io.to(`board:${boardId}`).emit('BE_COLUMN_MOVED', {
        boardId,
        columnOrderIds,
        actor: socket.id,
        boardVersion: Date.now()
      })
    } catch (error) {
      console.error('Error handling FE_COLUMN_MOVED:', error)
    }
  })

  socket.on('FE_COLUMN_CREATED', async (data) => {
    try {
      const { boardId, createdColumn } = data

      // Broadcast đến tất cả client khác trong room board (trừ sender)
      socket.broadcast.to(`board:${boardId}`).emit('BE_COLUMN_CREATED', {
        boardId,
        createdColumn,
        actor: socket.id,
        boardVersion: Date.now()
      })
    } catch (error) {
      console.error('Error handling FE_COLUMN_CREATED:', error)
    }
  })

  socket.on('FE_COLUMN_UPDATED', async (data) => {
    try {
      const { boardId, columnId, newTitle } = data

      // Không cần update DB vì API đã làm, chỉ broadcast để notify các client khác
      socket.broadcast.to(`board:${boardId}`).emit('BE_COLUMN_UPDATED', {
        boardId,
        columnId,
        newTitle,
        actor: socket.id,
        boardVersion: Date.now()
      })
    } catch (error) {
      console.error('Error handling FE_COLUMN_UPDATED:', error)
    }
  })

  socket.on('FE_COLUMN_DELETED', async (data) => {
    try {
      const { boardId, columnId } = data
      socket.broadcast.to(`board:${boardId}`).emit('BE_COLUMN_DELETED', {
        boardId,
        columnId,
        actor: socket.id,
        boardVersion: Date.now()
      })
    } catch (error) {
      console.error('Error handling FE_COLUMN_DELETED:', error)
    }
  })
}
