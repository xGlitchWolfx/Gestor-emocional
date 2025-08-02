import { Router } from 'express'
import {
  crearEmpresa,
  verEmpleados,
  unirseAEmpresa,
  actualizarEmpresa,
  verMiEmpresa,
  listarMisEmpresas,
  seleccionarEmpresa,
  eliminarEmpresa,
  generarCodigoInvitacion,
  expulsarEmpleado
} from '../controllers/empresaController.js'

import passport from 'passport'

const router = Router()

router.use(passport.authenticate('jwt', { session: false }))

router.post('/crear', crearEmpresa)
router.get('/empleados', verEmpleados)
router.post('/unirse', unirseAEmpresa)
router.put('/actualizar', actualizarEmpresa)
router.get('/mi-empresa', verMiEmpresa)
router.get('/mis-empresas', listarMisEmpresas)
router.post('/seleccionar/:id', seleccionarEmpresa)
router.delete('/eliminar/:id', eliminarEmpresa)
router.put('/generar-invitacion', generarCodigoInvitacion)
router.post('/expulsar/:id', expulsarEmpleado)

export default router
