import { Schema, model } from 'mongoose'

const messageSchema = new Schema({
  de: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 'para' puede ser un User ID (privado) o un Empresa ID (grupal)
  para: {
    type: Schema.Types.ObjectId,
    required: true
  },
  contenido: {
    type: String,
    required: true,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['privado', 'grupal'],
    required: true
  },
  empresa: {
    type: Schema.Types.ObjectId,
    ref: 'Empresa',
    required: true
  }
}, {
  timestamps: true
})

export default model('Message', messageSchema)