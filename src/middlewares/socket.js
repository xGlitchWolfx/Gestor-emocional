import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Message from '../models/Message.js'

// Objeto para mantener un registro de los usuarios conectados y su socket.id
const usuariosConectados = {}

export default function (io) {
  // Middleware de autenticación para Socket.io
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error('Autenticación fallida: no hay token.'))
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const usuario = await User.findById(decoded.id).select('-contrasena -token')
      if (!usuario) {
        return next(new Error('Autenticación fallida: usuario no encontrado.'))
      }
      socket.usuario = usuario
      socket.empresaId = decoded.empresaId
      next()
    } catch (error) {
      return next(new Error('Autenticación fallida: token inválido.'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.usuario.nombre} (${socket.id})`)

    // Guardar el usuario conectado para mensajes privados
    usuariosConectados[socket.usuario._id] = socket.id

    // --- MEJORA: Gestión de estado online/offline ---
    if (socket.empresaId) {
      // 1. Unir al usuario a la sala de su empresa
      socket.join(socket.empresaId.toString())
      console.log(`${socket.usuario.nombre} se unió a la sala de la empresa ${socket.empresaId}`)

      // 2. Notificar a los demás en la sala que este usuario está en línea
      socket.to(socket.empresaId.toString()).emit('usuario-online', { userId: socket.usuario._id })

      // 3. Enviar al usuario que se conecta la lista de todos los que ya están en línea en su empresa
      const room = io.sockets.adapter.rooms.get(socket.empresaId.toString())
      if (room) {
        const onlineUserIds = []
        for (const socketId of room) {
          const connectedSocket = io.sockets.sockets.get(socketId)
          if (connectedSocket?.usuario) {
            onlineUserIds.push(connectedSocket.usuario._id)
          }
        }
        socket.emit('lista-usuarios-online', onlineUserIds)
      }
    }

    // Escuchar mensajes grupales
    socket.on('mensaje-grupal', async (payload) => {
      try {
        const { contenido } = payload
        const empresaId = socket.empresaId
        if (!empresaId) return

        const mensaje = new Message({ de: socket.usuario._id, para: empresaId, contenido, tipo: 'grupal', empresa: empresaId })
        await mensaje.save()

        const mensajeParaEnviar = await Message.findById(mensaje._id).populate('de', 'nombre')
        io.to(empresaId.toString()).emit('nuevo-mensaje-grupal', mensajeParaEnviar)
      } catch (error) {
        console.error('Error al procesar mensaje grupal:', error)
      }
    })

    // Escuchar mensajes privados
    socket.on('mensaje-privado', async (payload) => {
      try {
        const { para, contenido } = payload
        const empresaId = socket.empresaId
        if (!empresaId) return

        const mensaje = new Message({ de: socket.usuario._id, para, contenido, tipo: 'privado', empresa: empresaId })
        await mensaje.save()

        const mensajeParaEnviar = await Message.findById(mensaje._id).populate('de', 'nombre')

        // Enviar al destinatario si está conectado
        const socketDestinatarioId = usuariosConectados[para]
        if (socketDestinatarioId) {
          io.to(socketDestinatarioId).emit('nuevo-mensaje-privado', mensajeParaEnviar)
        }
        // También enviárselo de vuelta al emisor para que lo vea en su UI
        socket.emit('nuevo-mensaje-privado', mensajeParaEnviar)
      } catch (error) {
        console.error('Error al procesar mensaje privado:', error)
      }
    })

    // --- MEJORA: Indicador "Está escribiendo..." ---
    socket.on('typing-start', (payload) => {
      const { chatId, chatType } = payload // chatId es el ID del otro usuario (privado) o de la empresa (grupal)

      if (chatType === 'privado') {
        const socketDestinatarioId = usuariosConectados[chatId]
        if (socketDestinatarioId) {
          // Avisamos al otro usuario que el emisor está escribiendo en su chat
          io.to(socketDestinatarioId).emit('display-typing', { chatId: socket.usuario._id })
        }
      } else if (chatType === 'grupal') {
        // Avisamos a todos en la sala (menos al emisor) que alguien está escribiendo
        socket.to(socket.empresaId.toString()).emit('display-typing', {
          chatId: socket.empresaId.toString(),
          user: { _id: socket.usuario._id, nombre: socket.usuario.nombre }
        })
      }
    })

    socket.on('typing-stop', (payload) => {
      const { chatId, chatType } = payload

      if (chatType === 'privado') {
        const socketDestinatarioId = usuariosConectados[chatId]
        if (socketDestinatarioId) {
          io.to(socketDestinatarioId).emit('hide-typing', { chatId: socket.usuario._id })
        }
      } else if (chatType === 'grupal') {
        socket.to(socket.empresaId.toString()).emit('hide-typing', { chatId: socket.empresaId.toString(), user: { _id: socket.usuario._id } })
      }
    })

    // Manejar desconexión
    socket.on('disconnect', () => {
      console.log(`Usuario desconectado: ${socket.usuario.nombre} (${socket.id})`)
      if (socket.empresaId) {
        io.to(socket.empresaId.toString()).emit('usuario-offline', { userId: socket.usuario._id })
      }
      delete usuariosConectados[socket.usuario._id]
    })
  })
}