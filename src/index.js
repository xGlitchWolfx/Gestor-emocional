import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import mongoose from 'mongoose'
import app from './app.js'
import configureSocket from './middlewares/socket.js'

const PORT = process.env.PORT || 8080;

// Crear servidor HTTP a partir de la app de Express
const server = http.createServer(app)

// Crear instancia de Socket.io y adjuntarla al servidor HTTP
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL, // Asegúrate de tener esta variable en tu .env
    methods: ['GET', 'POST']
  }
})

// Configurar la lógica del socket
configureSocket(io)

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB conectado')
  server.listen(PORT, () => { // Ahora es el servidor HTTP el que escucha
    console.log(`Servidor corriendo en el puerto ${PORT}`)
  })
}).catch(err => {
  console.error('Error de conexión a MongoDB:', err)
})
