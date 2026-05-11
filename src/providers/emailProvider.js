import nodemailer from 'nodemailer'
import { env } from '~/config/environment'

const createTrans = () => {
  return nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: Number(env.EMAIL_PORT),
    secure: false,
    auth: {
      user: env.EMAIL_FROM,
      pass: env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 30000
  })
}

const sendEmail = async (to, toName, subject, html) => {
  try {
    console.log('START SEND MAIL')

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

    const info = await transporter.sendMail(mailOptions)

    console.log('MAIL SENT:', info)

  } catch (error) {
    console.log('MAIL ERROR:', error)
    throw error
  }
}

export const nodeMailer = { sendEmail }
