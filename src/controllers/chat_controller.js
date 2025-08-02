import Message from '../models/Message.js'

const obtenerChatGrupal = async (req, res) => {
  const empresaId = req.empresaId

  if (!empresaId) {
    return res.status(400).json({ msg: 'No estás asociado a una empresa activa.' })
  }

  try {
    const mensajes = await Message.find({
      empresa: empresaId,
      tipo: 'grupal'
    })
      .populate('de', 'nombre')
      .sort({ createdAt: 'asc' })

    res.status(200).json(mensajes)
  } catch (error) {
    console.error('Error al obtener el chat grupal:', error)
    res.status(500).json({ msg: 'Hubo un error en el servidor.' })
  }
}

const obtenerChatPrivado = async (req, res) => {
  const miId = req.user._id
  const otroUsuarioId = req.params.id
  const empresaId = req.empresaId

  if (!empresaId) {
    return res.status(400).json({ msg: 'No estás asociado a una empresa activa.' })
  }

  try {
    const mensajes = await Message.find({
      empresa: empresaId,
      tipo: 'privado',
      $or: [
        { de: miId, para: otroUsuarioId },
        { de: otroUsuarioId, para: miId }
      ]
    })
      .populate('de', 'nombre')
      .sort({ createdAt: 'asc' })

    res.status(200).json(mensajes)
  } catch (error) {
    console.error('Error al obtener el chat privado:', error)
    res.status(500).json({ msg: 'Hubo un error en el servidor.' })
  }
}

export {
  obtenerChatGrupal,
  obtenerChatPrivado
}