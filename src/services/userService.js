import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { WEBSITE_DOMAIN } from '~/utils/constants'
import { env } from '~/config/environment'
import { StatusCodes } from 'http-status-codes'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatters'
import { nodeMailer } from '~/providers/emailProvider'
import { JwtProvider } from '~/providers/JwtProvider'
import { CloudinaryProvider } from '~/providers/cloudinaryProvider'
import { cardModel } from '~/models/cardModel'
const createNew = async (reqBody) => {
  try {
    const existedUser = await userModel.findOneByEmail(reqBody.email)
    if (existedUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already exists!')
    }

    const nameFromEmail = reqBody.email.split('@')[0]
    const newUser = {
      email: reqBody.email,
      password: bcryptjs.hashSync(reqBody.password, 8),
      userName: nameFromEmail,
      displayName: nameFromEmail,
      verifyToken: uuidv4()
    }

    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`

    const customSubject = 'Joji: Please verify your email before using our services!'

    const htmlContent = `
      <div style="
        background-color: #f4f5f7;
        padding: 40px 20px;
        font-family: Arial, sans-serif;
      ">
        <div style="
          max-width: 600px;
          margin: auto;
          background: white;
          border-radius: 12px;
          padding: 40px 30px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        ">
          <h1 style="
            color: #1976d2;
            margin-bottom: 10px;
          ">
            Welcome to Joji
          </h1>

          <p style="
            color: #555;
            font-size: 16px;
            line-height: 1.6;
          ">
            Thank you for creating an account.
            Please verify your email address to start using Joji.
          </p>

          <a
            href="${verificationLink}"
            style="
              display: inline-block;
              margin-top: 24px;
              padding: 14px 28px;
              background-color: #1976d2;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
            "
          >
            Verify Email
          </a>

          <p style="
            margin-top: 30px;
            font-size: 14px;
            color: #777;
            word-break: break-all;
          ">
            If the button does not work, copy and paste this link into your browser:
            <br /><br />
            ${verificationLink}
          </p>

          <hr style="
            margin: 32px 0;
            border: none;
            border-top: 1px solid #eee;
          " />

          <p style="
            color: #999;
            font-size: 13px;
          ">
            Joji - Task Management Platform
          </p>
        </div>
      </div>
    `
    await nodeMailer.sendEmail(getNewUser.email, getNewUser.userName, customSubject, htmlContent)

    return pickUser(getNewUser)
  } catch (error) { throw error }
}

const verifyAccount = async (reqBody) => {
  try {
    const existUser = await userModel.findOneByEmail(reqBody.email)

    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    if (existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is already active!')
    if (reqBody.token !== existUser.verifyToken) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Token is invalid!')
    }

    const updateData = {
      isActive: true,
      verifyToken: null
    }
    const updatedUser = await userModel.update(existUser._id, updateData)

    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

const login = async (reqBody) => {
  try {
    const existUser = await userModel.findOneByEmail(reqBody.email)

    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not active!')
    if (!bcryptjs.compareSync(reqBody.password, existUser.password)) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your Email or Password is incorrect!')
    }

    const userInfo = {
      _id: existUser._id,
      email: existUser.email
    }

    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_LIFE)

    const refreshToken = await JwtProvider.generateToken(
      userInfo,
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
      env.REFRESH_TOKEN_LIFE)

    return { accessToken, refreshToken, ...pickUser(existUser) }
  } catch (error) {
    throw error
  }
}

const forgotPassword = async (email) => {
  try {
    const existUser = await userModel.findOneByEmail(email)

    if (!existUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    }

    const resetToken = uuidv4()

    const updateData = {
      resetPasswordToken: resetToken,
      resetPasswordExpires: Date.now() + 15 * 60 * 1000
    }

    await userModel.update(existUser._id, updateData)

    const resetLink =
      `${WEBSITE_DOMAIN}/reset-password?token=${resetToken}`

    const customSubject = 'Joji: Reset your password'

    const htmlContent = `
      <div style="
        background-color: #f4f5f7;
        padding: 40px 20px;
        font-family: Arial, sans-serif;
      ">
        <div style="
          max-width: 600px;
          margin: auto;
          background: white;
          border-radius: 12px;
          padding: 40px 30px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        ">
          <h1 style="
            color: #1976d2;
            margin-bottom: 10px;
          ">
            Reset Your Password
          </h1>

          <p style="
            color: #555;
            font-size: 16px;
            line-height: 1.6;
          ">
            Hello ${existUser.displayName},
            <br /><br />
            We received a request to reset your password.
            Click the button below to continue.
          </p>

          <a
            href="${resetLink}"
            style="
              display: inline-block;
              margin-top: 24px;
              padding: 14px 28px;
              background-color: #1976d2;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
            "
          >
            Reset Password
          </a>

          <p style="
            margin-top: 24px;
            color: #777;
            font-size: 14px;
          ">
            This link will expire in 15 minutes.
          </p>

          <p style="
            margin-top: 30px;
            font-size: 14px;
            color: #777;
            word-break: break-all;
          ">
            If the button does not work, copy and paste this link into your browser:
            <br /><br />
            ${resetLink}
          </p>

          <hr style="
            margin: 32px 0;
            border: none;
            border-top: 1px solid #eee;
          " />

          <p style="
            color: #999;
            font-size: 13px;
          ">
            Joji - Task Management Platform
          </p>
        </div>
      </div>
    `

    await nodeMailer.sendEmail(
      existUser.email,
      customSubject,
      htmlContent
    )

    return { success: true }
  } catch (error) {
    throw error
  }
}

const resetPassword = async (reqBody) => {
  try {
    const usersCollection = await userModel.findOneByResetToken(reqBody.token)

    if (!usersCollection) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Invalid reset token!')
    }

    if (Date.now() > usersCollection.resetPasswordExpires) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Reset token has expired!')
    }

    await userModel.update(usersCollection._id, {
      password: bcryptjs.hashSync(reqBody.password, 8),
      resetPasswordToken: null,
      resetPasswordExpires: null
    })

    return { success: true }
  } catch (error) {
    throw error
  }
}

const refreshToken = async (clientRefreshToken) => {
  try {
    const refreshTokenDecoded = await JwtProvider.verifyToken(
      clientRefreshToken,
      env.REFRESH_TOKEN_SECRET_SIGNATURE
    )

    const userInfo = { _id: refreshTokenDecoded._id, email: refreshTokenDecoded.email }

    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_LIFE
    )

    return { accessToken }
  } catch (error) { throw error }
}

const update = async (userId, reqBody, userAvatarFile) => {
  try {
    const existUser = await userModel.findOneById(userId)
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not active!')

    let updatedUser = {}

    if (reqBody.current_password && reqBody.new_password) {
      if (!bcryptjs.compareSync(reqBody.current_password, existUser.password)) {
        throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your Current Password is incorrect!')
      }
      updatedUser = await userModel.update(existUser._id, {
        password: bcryptjs.hashSync(reqBody.new_password, 8)
      })
    } else if (userAvatarFile) {
      const uploadResult = await CloudinaryProvider.streamUpload(userAvatarFile.buffer, 'users')

      updatedUser = await userModel.update(existUser._id, {
        avatar: uploadResult.secure_url
      })

      await cardModel.updateManyComments(existUser._id.toString(), {
        avatar: uploadResult.secure_url,
        displayName: existUser.displayName
      })
    }
    else {
      updatedUser = await userModel.update(existUser._id, reqBody)
      await cardModel.updateManyComments(existUser._id.toString(), {
        avatar: existUser.avatar,
        displayName: reqBody.displayName
      })
    }
    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

export const userService = {
  createNew,
  verifyAccount,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  update
}
