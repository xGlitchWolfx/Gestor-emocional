import { Router } from 'express'
import {
  crearTarea,
  editarTarea,
  eliminarTarea,
  listarMisTareas,
  completarTarea,
  revisarTarea,
  listarTareasParaRevision,
  listarTareasDeEmpleado,
  recomendarTareas
} from '../controllers/tarea_controller.js'
import passport from 'passport'
import upload from '../middlewares/upload.js'
import { esJefe, esEmpleado } from '../middlewares/autorizacion.js'

const router = Router()

// Aplicar autenticación a TODAS las rutas de este archivo
router.use(passport.authenticate('jwt', { session: false }))

// Rutas para Jefes
router.post('/crear', esJefe, crearTarea)
router.put('/:id', esJefe, editarTarea)
router.delete('/:id', esJefe, eliminarTarea)
router.post('/:id/revisar', esJefe, revisarTarea)
router.get('/para-revision', esJefe, listarTareasParaRevision)
router.get('/empleado/:id', esJefe, listarTareasDeEmpleado)

// Rutas para Empleados
router.get('/mis-tareas', esEmpleado, listarMisTareas)
router.post('/recomendar', esEmpleado, recomendarTareas)
router.post('/:id/completar', esEmpleado, upload.single('archivo'), completarTarea)

export default router