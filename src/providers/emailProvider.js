import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend'
import { env } from '~/config/environment'

const MAILER_SEND_API_KEY = env.MAILER_SEND_API_KEY
const ADMIN_SENDER_EMAIL = env.ADMIN_SENDER_EMAIL
const ADMIN_SENDER_NAME = env.ADMIN_SENDER_NAME

const mailerSendInstance = new MailerSend({ apiKey: MAILER_SEND_API_KEY })

const sender = new Sender(ADMIN_SENDER_EMAIL, ADMIN_SENDER_NAME)

const sendEmail = async (to, toName, subject, html) => {
  try {
    const recipients = [new Recipient(to, toName)]

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setReplyTo(sender)
      .setSubject(subject)
      .setHtml(html)

    return await mailerSendInstance.email.send(emailParams)

  } catch (error) {
    throw error
  }
}
export const emailProvider = { sendEmail }