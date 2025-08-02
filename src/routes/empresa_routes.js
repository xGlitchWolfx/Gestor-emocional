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

import { verificarTokenJWT } from '../middlewares/JWT.js'

const router = Router()

router.post('/crear', verificarTokenJWT, crearEmpresa)

router.get('/empleados', verificarTokenJWT, verEmpleados)

router.post('/unirse', verificarTokenJWT, unirseAEmpresa)

router.put('/actualizar', verificarTokenJWT, actualizarEmpresa)

router.get('/mi-empresa', verificarTokenJWT, verMiEmpresa)

router.get('/mis-empresas', verificarTokenJWT, listarMisEmpresas)

router.post('/seleccionar/:id', verificarTokenJWT, seleccionarEmpresa)

router.delete('/eliminar/:id', verificarTokenJWT, eliminarEmpresa)

router.put('/generar-invitacion', verificarTokenJWT, generarCodigoInvitacion)

router.post('/expulsar/:id', verificarTokenJWT, expulsarEmpleado)

export default router
