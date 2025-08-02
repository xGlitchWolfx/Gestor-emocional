import { Router } from 'express'
import passport from 'passport'
import { obtenerChatGrupal, obtenerChatPrivado } from '../controllers/chat_controller.js'
import { esRol } from '../middlewares/autorizacion.js'

const router = Router()

// Proteger todas las rutas de chat
router.use(passport.authenticate('jwt', { session: false }))

// Obtener mensajes del chat grupal de la empresa
router.get('/grupal', esRol('jefe', 'empleado'), obtenerChatGrupal)

// Obtener mensajes de un chat privado con otro usuario
router.get('/privado/:id', esRol('jefe', 'empleado'), obtenerChatPrivado)

export default router