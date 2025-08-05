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
  analizarEstadoAnimo,
  socialLoginCallback,
  textoAImagen
} from '../controllers/usuario_Controller.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'

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

// --- Rutas de Autenticación Social ---

// Google - RUTAS CORREGIDAS
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: true // Habilitar sesión para OAuth
  })
)

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
    session: true 
  }),
  socialLoginCallback
)

// --- Middleware de Autenticación JWT para las siguientes rutas ---
router.use(passport.authenticate('jwt', { session: false }))


// --- Rutas Protegidas (requieren token) ---
router.get('/perfil', perfil)
router.put('/perfil', actualizarPerfil)
router.put('/actualizar-password', actualizarPassword)
router.post('/analizar-animo', esEmpleado, analizarEstadoAnimo)
router.post('/texto-imagen', verificarTokenJWT, textoAImagen)

export default router