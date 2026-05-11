import { Resend } from 'resend'
import { env } from '~/config/environment'

const resend = new Resend(env.RESEND_API_KEY)

const sendEmail = async (to, subject, html) => {
  try {
    await resend.emails.send({
      from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
      to: to,
      subject,
      html
    })
  } catch (error) {
    throw error
  }
}

export const nodeMailer = { sendEmail }