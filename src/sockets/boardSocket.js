import { boardModel } from '~/models/boardModel'
import { userModel } from '~/models/userModel'
import { ObjectId } from 'mongodb'

const boardSocket = (io, socket) => {
  socket.on('FE_BOARD_UPDATED', async ({ boardId, newTitle, newDescription, actor }) => {
    io.emit('BE_BOARD_UPDATED', {
      boardId,
      newTitle,
      newDescription,
      actor,
      boardVersion: Date.now()
    })
  })

  socket.on('FE_BOARD_DELETED', ({ boardId, actor }) => {
    try {
      io.emit('BE_BOARD_DELETED', {
        boardId,
        actor,
        boardVersion: Date.now()
      })
    } catch (error) {
      socket.emit('BE_ERROR', { message: 'Failed to handle board deletion' })
    }
  })

  socket.on('FE_USER_REMOVED_FROM_BOARD', async ({ boardId, userId, removedBy, isSelf }) => {
    try {
      // Tìm board
      const board = await boardModel.findOneById(boardId)
      if (!board) {
        socket.emit('BE_ERROR', {
          message: 'Board not found',
          boardId,
          userId,
          isSelf
        })
        return
      }

      // Cập nhật danh sách thành viên
      const result = await boardModel.updateMembers(boardId, {
        userId,
        action: 'REMOVE'
      })

      console.log('Update members result:', { boardId, userId, found: !!result.value })

      // Phát sự kiện tới tất cả client trong board
      io.emit('BE_USER_REMOVED_FROM_BOARD', {
        boardId,
        userId,
        removedBy,
        isSelf,
        boardVersion: Date.now()
      })

      // Nếu là bị owner xóa, thông báo riêng cho user bị xóa
      if (!isSelf) {
        io.to(userId).emit('BE_USER_REMOVED_FROM_BOARD', {
          boardId,
          userId,
          removedBy,
          isSelf,
          message: 'You have been removed from the board!'
        })
      } else {
        io.to(userId).emit('BE_USER_REMOVED_FROM_BOARD', {
          boardId,
          userId,
          removedBy,
          isSelf,
          message: 'You have left the board!'
        })
      }
    } catch (error) {
      socket.emit('BE_ERROR', { message: error.message || 'Failed to handle user removal from board' })
    }
  })

  socket.on('FE_ADD_USER_TO_BOARD', async ({ boardId, userId, inviteeEmail }) => {
    try {
      // Convert sang ObjectId
      const boardObjectId = new ObjectId(boardId)
      const userObjectId = new ObjectId(userId)

      // Lấy board từ DB
      const board = await boardModel.findOneById(boardObjectId)
      if (!board) {
        socket.emit('BE_ERROR', { message: 'Board not found', boardId })
        return
      }

      // Lấy thông tin user
      const existingUser = await userModel.findOneById(userObjectId)

      // Emit cho tất cả client trong room board
      const payload = {
        boardId: boardId.toString(),
        userId: userId.toString(),
        inviteeEmail,
        user: {
          _id: userId.toString(),
          displayName: existingUser?.displayName || inviteeEmail,
          avatar: existingUser?.avatar || ''
        },
        boardVersion: Date.now()
      }

      io.in(`board:${boardId}`).emit('BE_USER_ADDED_TO_BOARD', payload)
    } catch (error) {
      socket.emit('BE_ERROR', { message: error.message })
    }
  })

}

export default boardSocket