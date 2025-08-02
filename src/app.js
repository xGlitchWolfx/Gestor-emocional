import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import routerAuth from './routes/usuario_routes.js'  
import routerEmpresa from './routes/empresa_routes.js' 

dotenv.config()
const app = express()

app.set('port', process.env.PORT || 5000)
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => res.send('Servidor corriendo'))

app.use('/api/auth', routerAuth)
app.use('/api/empresa', routerEmpresa) 

app.use((req, res) => res.status(404).send('Endpoint no encontrado - 404'))

export default app
