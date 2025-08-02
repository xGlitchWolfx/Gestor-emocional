import { Schema, model } from 'mongoose'

const tareaSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'en_progreso', 'completada', 'en_revision'],
    default: 'pendiente'
  },
  dificultad: {
    type: String,
    enum: ['baja', 'media', 'alta'],
    required: true
  },
  asignadoA: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  empresa: {
    type: Schema.Types.ObjectId,
    ref: 'Empresa',
    required: true
  },
  fechaLimite: {
    type: Date,
    default: null
  },
  recompensaXP: {
    type: Number,
    required: true,
    default: 0
  },
  recompensaMonedas: {
    type: Number,
    required: true,
    default: 0
  },
  informeCompletado: {
    texto: { type: String, trim: true },
    urlImagen: { type: String, trim: true },
    imagenPublicId: { type: String, trim: true },
    comentarioRechazo: { type: String, trim: true }
  }
}, {
  timestamps: true
})

export default model('Tarea', tareaSchema)