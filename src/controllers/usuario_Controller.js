import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { sendMailToRegister, sendMailToRecoveryPassword } from '../config/sendMailToRegister.js'

// Generar token JWT
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.rol }, process.env.JWT_SECRET, { expiresIn: '1d' })
}

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

// Login
const login = async (req, res) => {
  const { correo, contrasena } = req.body;

  if (Object.values(req.body).includes("")) {
    return res.status(400).json({ msg: "Todos los campos son obligatorios" });
  }

  const usuario = await User.findOne({ correo }).select("-__v -token -updatedAt -createdAt");

  if (!usuario) {
    return res.status(404).json({ msg: "El usuario no está registrado" });
  }

  if (!usuario.confirmEmail) {
    return res.status(403).json({ msg: "Debes confirmar tu cuenta antes de iniciar sesión" });
  }

  const passwordValido = await usuario.compararContrasena(contrasena);
  if (!passwordValido) {
    return res.status(401).json({ msg: "La contraseña no es válida" });
  }

  const { nombre, telefono, rol, _id } = usuario;

  return res.status(200).json({
    rol,
    nombre,
    telefono,
    correo: usuario.correo,
    _id
  });
};


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


export {
  register,
  confirmarCuenta,
  login,
  recuperarPassword,
  comprobarTokenPassword,
  crearNuevoPassword
}
