import { Router } from 'express'
import {
  register,
  login,
  confirmarCuenta,
  recuperarPassword,
  comprobarTokenPassword,
  crearNuevoPassword,
  perfil,
  actualizarPerfil,
  actualizarPassword,
  analizarEstadoAnimo
} from '../controllers/usuario_Controller.js'

import passport from 'passport'
import { esEmpleado } from '../middlewares/autorizacion.js'

const router = Router()

// --- Rutas Públicas (no requieren token) ---
router.post('/register', register)
router.post('/login', login)
router.get('/confirmar/:token', confirmarCuenta)
router.post('/recuperar-password', recuperarPassword)
router.get('/recuperar-password/:token', comprobarTokenPassword)
router.post('/recuperar-password/:token', crearNuevoPassword)

// --- Middleware de Autenticación para las siguientes rutas ---
router.use(passport.authenticate('jwt', { session: false }))

// --- Rutas Protegidas (requieren token) ---
router.get('/perfil', perfil)
router.put('/perfil', actualizarPerfil)
router.put('/actualizar-password', actualizarPassword)
router.post('/analizar-animo', esEmpleado, analizarEstadoAnimo)

export default router
