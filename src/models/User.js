import { Schema, model } from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  correo: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  contrasena: {
    type: String,
    required: true
  },
  telefono: {
    type: String,
    trim: true,
    default: null
  },
  rol: {
    type: String,
    enum: ['usuario', 'jefe', 'empleado'],
    default: 'usuario'
  },
  status: {
    type: Boolean,
    default: true
  },
  token: {
    type: String,
    default: null
  },
  confirmEmail: {
    type: Boolean,
    default: false
  },
    tokenRecuperacion: {
    type: String,
    default: null
  },
  expiraToken: {
    type: Date,
    default: null
  },

}, {
  timestamps: true
})

// Método para cifrar contraseña
userSchema.methods.encriptarContrasena = async function (contrasena) {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(contrasena, salt)
}

// Método para verificar contraseña
userSchema.methods.compararContrasena = async function (contrasena) {
  return await bcrypt.compare(contrasena, this.contrasena)
}

// Método para crear token de confirmación
userSchema.methods.generarToken = function () {
  this.token = Math.random().toString(36).slice(2)
  return this.token
}

export default model('User', userSchema)