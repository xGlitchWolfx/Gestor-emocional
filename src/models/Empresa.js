import { Schema, model } from 'mongoose'

const empresaSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  direccion: {
    type: String,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  creadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  empleados: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  tokenInvitacion: {
    type: String,
    default: () => Math.random().toString(36).substring(2, 10)
  }
}, {
  timestamps: true
})

export default model('Empresa', empresaSchema)
