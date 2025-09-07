const { userModel } = require('~/models/userModel')
const { boardModel } = require('~/models/boardModel')

const userSocket = (io, socket) => {
  socket.on('FE_USER_AVATAR_UPDATED', async ({ userId, newAvatarUrl }) => {
    try {
      const user = await userModel.findOneById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      const { boards } = await boardModel.getBoards(userId, 1, Number.MAX_SAFE_INTEGER, null)
      const boardIds = boards.map(board => board._id.toString())

      boardIds.forEach(boardId => {
        socket.broadcast.to(`board:${boardId}`).emit('BE_USER_AVATAR_UPDATED', {
          userId,
          newAvatarUrl,
          actor: socket.id,
          boardVersion: Date.now()
        })
      })
    } catch (error) {
      socket.emit('BE_ERROR', { message: 'Failed to update user avatar' })
    }
  })

  socket.on('FE_USER_DISPLAYNAME_UPDATED', async ({ userId, newDisplayName }) => {
    try {
      const user = await userModel.findOneById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      const { boards } = await boardModel.getBoards(userId, 1, Number.MAX_SAFE_INTEGER, null)
      const boardIds = boards.map(board => board._id.toString())

      boardIds.forEach(boardId => {
        socket.broadcast.to(`board:${boardId}`).emit('BE_USER_DISPLAYNAME_UPDATED', {
          userId,
          newDisplayName,
          actor: socket.id,
          boardVersion: Date.now()
        })
      })
    } catch (error) {
      socket.emit('BE_ERROR', { message: 'Failed to update user display name' })
    }
  })
}

module.exports = userSocket