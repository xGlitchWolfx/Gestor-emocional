import express from 'express'
import cors from 'cors'
import session from 'express-session'  // AGREGAR ESTO
import passport from './middlewares/passport.js'

import routerAuth from './routes/usuario_routes.js'  
import routerEmpresa from './routes/empresa_routes.js'
import routerTareas from './routes/tarea_routes.js'
import routerPagos from './routes/pagoRoutes.js'
import routerChat from './routes/chat_routes.js'

const app = express()

app.set('port', process.env.PORT || 8080) // CAMBIAR A 8080

// CORS configurado correctamente
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

// Configuración de sesiones ANTES de passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true solo en HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}))

// Inicializar passport DESPUÉS de session
app.use(passport.initialize())
app.use(passport.session()) // AGREGAR ESTO

app.use(express.json())

app.get('/', (req, res) => res.send('Servidor corriendo en puerto 8080'))

// Rutas
app.use('/api/auth', routerAuth)
app.use('/api/empresa', routerEmpresa)
app.use('/api/tareas', routerTareas)
app.use('/api/pagos', routerPagos)
app.use('/api/chat', routerChat)
app.use('/uploads', express.static('uploads'))

app.use((req, res) => res.status(404).json({ msg: 'Endpoint no encontrado - 404' }))

export default app