import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

/**
 * Enviar correo para confirmar cuenta
 */
const sendMailToRegister = (userMail, token) => {
  const mailOptions = {
    from: 'confirmacion@neureko.com',
    to: userMail,
    subject: 'Neureko - Confirma tu cuenta',
    html: `
      <h2>Bienvenido a Neureko 🧠</h2>
      <p>Haz clic <a href="${process.env.FRONTEND_URL}confirmar/${token}">aquí</a> para confirmar tu cuenta.</p>
      <hr />
      <footer>¡Gracias por unirte a nuestra plataforma de gestión emocional!</footer>
    `
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error al enviar correo de confirmación:', error)
    } else {
      console.log('Correo de confirmación enviado:', info.messageId)
    }
  })
}

/**
 * Enviar correo para recuperación de contraseña
 */
const sendMailToRecoveryPassword = async (userMail, token) => {
  const mailOptions = {
    from: 'soporte@neureko.com',
    to: userMail,
    subject: 'Neureko - Recupera tu contraseña',
    html: `
      <h2>Recuperación de contraseña</h2>
      <p>Haz clic <a href="${process.env.FRONTEND_URL}recuperarpassword/${token}">aquí</a> para crear una nueva contraseña.</p>
      <hr />
      <footer>Si no solicitaste este correo, ignóralo. Tu salud emocional está en buenas manos con Neureko 🧠</footer>
    `
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Correo de recuperación enviado:', info.messageId)
  } catch (error) {
    console.error('Error al enviar correo de recuperación:', error)
  }
}

export { sendMailToRegister, sendMailToRecoveryPassword }
