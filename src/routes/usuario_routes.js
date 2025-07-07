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
  actualizarPassword
} from '../controllers/usuario_Controller.js'

import { verificarTokenJWT } from '../middlewares/JWT.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/confirmar/:token', confirmarCuenta)

router.post('/recuperar-password', recuperarPassword)
router.get('/recuperar-password/:token', comprobarTokenPassword)
router.post('/recuperar-password/:token', crearNuevoPassword)

router.get('/perfil', verificarTokenJWT, perfil)
router.put('/perfil', verificarTokenJWT, actualizarPerfil)

router.put('/actualizar-password', verificarTokenJWT, actualizarPassword)


export default router
