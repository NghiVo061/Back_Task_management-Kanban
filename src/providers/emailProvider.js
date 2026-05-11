import { Resend } from 'resend'
import { env } from '~/config/environment'

const resend = new Resend(env.RESEND_API_KEY)

const sendEmail = async (to, toName, subject, html) => {
  try {
    await resend.emails.send({
      from: 'noreply@joji.io.vn',
      to: to,
      subject,
      html
    })
  } catch (error) {
    throw error
  }
}

export const nodeMailer = { sendEmail }