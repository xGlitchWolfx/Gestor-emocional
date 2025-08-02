import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Empresa from '../models/Empresa.js'
import { sendMailToRegister, sendMailToRecoveryPassword } from '../config/sendMailToRegister.js'
import { crearTokenJWT } from '../middlewares/JWT.js'

// Registro de usuario
const register = async (req, res) => {
  const { nombre, correo, contrasena } = req.body

  if (!nombre || !correo || !contrasena)
    return res.status(400).json({ msg: 'Todos los campos son obligatorios' })

  if (contrasena.length < 5)
    return res.status(400).json({ msg: 'La contraseña debe tener al menos 5 caracteres' })

  const existe = await User.findOne({ correo })
  if (existe)
    return res.status(400).json({ msg: 'Correo ya registrado' })

  const nuevoUsuario = new User({ nombre, correo, rol: 'usuario' })
  nuevoUsuario.contrasena = await nuevoUsuario.encriptarContrasena(contrasena)
  const token = nuevoUsuario.generarToken()

  await nuevoUsuario.save()
  await sendMailToRegister(correo, token)

  res.status(201).json({ msg: 'Usuario registrado. Revisa tu correo para confirmar tu cuenta.' })
}

// Confirmar cuenta con token
const confirmarCuenta = async (req, res) => {
  const { token } = req.params

  const usuario = await User.findOne({ token })
  if (!usuario || usuario.confirmEmail)
    return res.status(404).json({ msg: 'Token inválido o cuenta ya confirmada' })

  usuario.token = null
  usuario.confirmEmail = true
  await usuario.save()

  res.status(200).json({ msg: 'Cuenta confirmada correctamente. Ya puedes iniciar sesión.' })
}

// Iniciar sesión
const login = async (req, res) => {
  const { correo, contrasena } = req.body

  if (!correo || !contrasena)
    return res.status(400).json({ msg: "Todos los campos son obligatorios" })

  const usuarioBDD = await User.findOne({ correo }).select("-__v -updatedAt -createdAt")

  if (!usuarioBDD)
    return res.status(404).json({ msg: "El usuario no se encuentra registrado" })

  if (!usuarioBDD.confirmEmail)
    return res.status(403).json({ msg: "Debes verificar tu cuenta" })

  const verificarPassword = await usuarioBDD.compararContrasena(contrasena)

  if (!verificarPassword)
    return res.status(401).json({ msg: "La contraseña no es correcta" })

  // 🟢 Token con empresaId incluido si aplica
  const token = await crearTokenJWT(usuarioBDD._id, usuarioBDD.rol)

  res.status(200).json({
    token,
    nombre: usuarioBDD.nombre,
    correo: usuarioBDD.correo,
    rol: usuarioBDD.rol,
    _id: usuarioBDD._id
  })
}

// Recuperar contraseña
const recuperarPassword = async (req, res) => {
  const { correo } = req.body
  if (!correo) return res.status(400).json({ msg: 'El campo correo es obligatorio' })

  const usuario = await User.findOne({ correo })
  if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' })

  const token = usuario.generarToken()
  usuario.token = token
  await usuario.save()

  await sendMailToRecoveryPassword(correo, token)
  res.status(200).json({ msg: 'Revisa tu correo electrónico para reestablecer tu contraseña' })
}

// Comprobar token de recuperación
const comprobarTokenPassword = async (req, res) => {
  const { token } = req.params

  const usuario = await User.findOne({ token })
  if (!usuario) return res.status(404).json({ msg: 'Token inválido o expirado' })

  res.status(200).json({ msg: 'Token válido. Puedes establecer nueva contraseña' })
}

// Crear nueva contraseña
const crearNuevoPassword = async (req, res) => {
  const { token } = req.params
  const { password, confirmpassword } = req.body

  if (!password || !confirmpassword)
    return res.status(400).json({ msg: 'Todos los campos son obligatorios' })

  if (password !== confirmpassword)
    return res.status(400).json({ msg: 'Las contraseñas no coinciden' })

  const usuario = await User.findOne({ token })
  if (!usuario) return res.status(404).json({ msg: 'Token inválido o expirado' })

  usuario.token = null
  usuario.contrasena = await usuario.encriptarContrasena(password)
  await usuario.save()

  res.status(200).json({ msg: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' })
}

// Obtener perfil
const perfil = (req, res) => {
  if (!req.usuarioBDD) {
    return res.status(401).json({ msg: "No autorizado" })
  }

  res.status(200).json(req.usuarioBDD)
}

// Actualizar perfil
const actualizarPerfil = async (req, res) => {
  const usuarioBDD = req.usuarioBDD
  const { nombre, correo, telefono } = req.body

  if (!usuarioBDD)
    return res.status(401).json({ msg: "No autorizado" })

  if (Object.values(req.body).includes(""))
    return res.status(400).json({ msg: "Todos los campos son obligatorios" })

  if (usuarioBDD.correo !== correo) {
    const correoExistente = await User.findOne({ correo })
    if (correoExistente) {
      return res.status(400).json({ msg: "El correo ya está registrado con otro usuario" })
    }
  }

  usuarioBDD.nombre = nombre ?? usuarioBDD.nombre
  usuarioBDD.correo = correo ?? usuarioBDD.correo
  usuarioBDD.telefono = telefono ?? usuarioBDD.telefono

  await usuarioBDD.save()

  res.status(200).json(usuarioBDD)
}

// Actualizar contraseña desde el perfil
const actualizarPassword = async (req, res) => {
  const { passwordactual, passwordnuevo } = req.body
  const usuarioBDD = req.usuarioBDD

  if (!usuarioBDD) return res.status(401).json({ msg: "No autorizado" })

  if (!passwordactual || !passwordnuevo)
    return res.status(400).json({ msg: "Debes llenar todos los campos" })

  const passwordValido = await usuarioBDD.compararContrasena(passwordactual)

  if (!passwordValido)
    return res.status(400).json({ msg: "La contraseña actual no es correcta" })

  usuarioBDD.contrasena = await usuarioBDD.encriptarContrasena(passwordnuevo)
  await usuarioBDD.save()

  res.status(200).json({ msg: "Contraseña actualizada correctamente" })
}

export {
  register,
  login,
  confirmarCuenta,
  recuperarPassword,
  comprobarTokenPassword,
  crearNuevoPassword,
  perfil,
  actualizarPerfil,
  actualizarPassword
}
