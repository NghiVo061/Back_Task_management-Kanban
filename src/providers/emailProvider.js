import { Resend } from 'resend'
import { env } from '~/config/environment'

const resend = new Resend(env.RESEND_API_KEY)

const sendEmail = async (to, toName, subject, html) => {
  try {
    console.log('START SEND MAIL')

    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: to,
      subject,
      html
    })

    console.log('MAIL SENT:', data)

  } catch (error) {
    console.log('MAIL ERROR:', error)
    throw error
  }
}

export const nodeMailer = { sendEmail }