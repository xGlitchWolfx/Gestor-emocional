import express from 'express'
import cors from 'cors'
import passport from './middlewares/passport.js'

import routerAuth from './routes/usuario_routes.js'  
import routerEmpresa from './routes/empresa_routes.js'
import routerTareas from './routes/tarea_routes.js'
import routerPagos from './routes/pagoRoutes.js'
import routerChat from './routes/chat_routes.js'
const app = express()

app.set('port', process.env.PORT || 5000)
app.use(passport.initialize())
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => res.send('Servidor corriendo'))

app.use('/api/auth', routerAuth)
app.use('/api/empresa', routerEmpresa)
app.use('/api/tareas', routerTareas)
app.use('/api/pagos', routerPagos)
app.use('/api/chat', routerChat)

app.use((req, res) => res.status(404).json({ msg: 'Endpoint no encontrado - 404' }))

export default app
