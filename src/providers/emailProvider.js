import nodemailer from 'nodemailer'
import { env } from '~/config/environment'

const createTrans = () => {
  return nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: true,
    auth: {
      user: env.EMAIL_FROM,
      pass: env.EMAIL_PASS
    }
  })
}

const sendEmail = async (to, toName, subject, html) => {
  try {
    const transporter = createTrans()
    const mailOptions = {
      from: {
        name: env.EMAIL_FROM_NAME,
        address: env.EMAIL_FROM
      },
      to: `${toName} <${to}>`,
      subject: subject,
      html: html
    }

    await transporter.sendMail(mailOptions)
  } catch (error) {
    throw error
  }
}

export const nodeMailer = { sendEmail }
