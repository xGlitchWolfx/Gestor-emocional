import Tarea from '../models/Tarea.js'
import Empresa from '../models/Empresa.js'
import { deleteImage } from '../config/cloudinary.js'

const crearTarea = async (req, res) => {
  const { nombre, descripcion, dificultad, asignadoA, recompensaXP, recompensaMonedas, fechaLimite } = req.body

  const jefe = req.user

  if (!req.empresaId) {
    return res.status(400).json({ msg: 'Debes seleccionar una empresa para poder asignar tareas.' })
  }

  if (!nombre || !descripcion || !dificultad || !asignadoA) {
    return res.status(400).json({ msg: 'Los campos nombre, descripción, dificultad y empleado asignado son obligatorios.' })
  }

  try {
    const empresa = await Empresa.findById(req.empresaId)
    if (!empresa) {
      return res.status(404).json({ msg: 'La empresa seleccionada no fue encontrada.' })
    }

    if (!empresa.empleados.includes(asignadoA)) {
      return res.status(403).json({ msg: 'El usuario seleccionado no es un empleado de tu empresa.' })
    }

    const nuevaTarea = new Tarea({
      ...req.body,
      creadoPor: jefe._id,
      empresa: req.empresaId
    })

    await nuevaTarea.save()

    res.status(201).json({ msg: 'Tarea creada correctamente.', tarea: nuevaTarea })
  } catch (error) {
    console.error('Error al crear la tarea:', error)
    res.status(500).json({ msg: 'Hubo un error en el servidor.' })
  }
}

const verificarJefeYPropietarioTarea = async (idTarea, idJefe) => {
  const tarea = await Tarea.findById(idTarea)
  if (!tarea) {
    throw { status: 404, msg: 'Tarea no encontrada.' }
  }
  if (tarea.creadoPor.toString() !== idJefe.toString()) {
    throw { status: 403, msg: 'Acción no autorizada. No eres el creador de esta tarea.' }
  }
  if (tarea.estado === 'completada') {
    throw { status: 400, msg: 'No se puede modificar o eliminar una tarea que ya ha sido completada.' }
  }
  return tarea
}

const editarTarea = async (req, res) => {
  const { id } = req.params
  const jefe = req.user

  try {
    const tarea = await verificarJefeYPropietarioTarea(id, jefe._id)

    tarea.nombre = req.body.nombre || tarea.nombre
    tarea.descripcion = req.body.descripcion || tarea.descripcion
    tarea.dificultad = req.body.dificultad || tarea.dificultad
    tarea.recompensaXP = req.body.recompensaXP || tarea.recompensaXP
    tarea.recompensaMonedas = req.body.recompensaMonedas || tarea.recompensaMonedas
    tarea.fechaLimite = req.body.fechaLimite || tarea.fechaLimite

    await tarea.save()

    res.status(200).json({ msg: 'Tarea actualizada correctamente.', tarea })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ msg: error.msg })
    }
    console.error('Error al editar la tarea:', error.message)
    res.status(500).json({ msg: 'Hubo un error en el servidor.' })
  }
}

const eliminarTarea = async (req, res) => {
  const { id } = req.params
  const jefe = req.user

  try {
    const tarea = await verificarJefeYPropietarioTarea(id, jefe._id)

    if (tarea.informeCompletado?.imagenPublicId) {
      await deleteImage(tarea.informeCompletado.imagenPublicId)
    }

    await tarea.deleteOne()
    res.status(200).json({ msg: 'Tarea eliminada correctamente.' })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ msg: error.msg })
    }
    console.error('Error al eliminar la tarea:', error.message)
    res.status(500).json({ msg: 'Hubo un error en el servidor.' })
  }
}

const listarMisTareas = async (req, res) => {
  // 1. El usuario (empleado) viene del middleware
  const empleado = req.user

  try {
    // 3. Buscar todas las tareas asignadas al ID del empleado y que pertenezcan a la empresa activa.
    const tareas = await Tarea.find({
      asignadoA: empleado._id,
      empresa: req.empresaId
    })
      .populate('creadoPor', 'nombre') // Para saber quién la creó
      .sort({ createdAt: -1 }) // Mostrar las más recientes primero

    res.status(200).json(tareas)
  } catch (error) {
    console.error('Error al listar las tareas del empleado:', error)
    res.status(500).json({ msg: 'Hubo un error en el servidor.' })
  }
}

const listarTareasDeEmpleado = async (req, res) => {
  const { id: empleadoId } = req.params
  const jefe = req.user

  // 2. Validar que el jefe tenga una empresa activa
  if (!req.empresaId) {
    return res.status(400).json({ msg: 'Debes seleccionar una empresa para realizar esta acción.' })
  }

  try {
    // 3. Validar que el empleado pertenezca a la empresa del jefe
    const empresa = await Empresa.findById(req.empresaId)
    if (!empresa.empleados.includes(empleadoId)) {
      return res.status(404).json({ msg: 'El empleado no fue encontrado en tu empresa.' })
    }

    // 4. Buscar todas las tareas del empleado en esa empresa
    const tareas = await Tarea.find({ asignadoA: empleadoId, empresa: req.empresaId }).sort({ createdAt: -1 })

    res.status(200).json(tareas)
  } catch (error) {
    console.error('Error al listar las tareas del empleado:', error)
    res.status(500).json({ msg: 'Hubo un error en el servidor.' })
  }
}

const completarTarea = async (req, res) => {
  const { id } = req.params
  const empleado = req.user

  try {
    const tarea = await Tarea.findById(id)

    if (!tarea) {
      return res.status(404).json({ msg: 'Tarea no encontrada.' })
    }

    if (tarea.asignadoA.toString() !== empleado._id.toString()) {
      return res.status(403).json({ msg: 'Acción no autorizada. No eres el asignado para esta tarea.' })
    }

    if (['completada', 'en_revision'].includes(tarea.estado)) {
      return res.status(400).json({ msg: 'Esta tarea ya fue completada o está en revisión.' })
    }

    tarea.estado = 'en_revision'
    tarea.informeCompletado.texto = req.body.texto || ''

    if (req.file) {
      tarea.informeCompletado.urlImagen = req.file.path
      tarea.informeCompletado.imagenPublicId = req.file.filename
    }

    await tarea.save()

    res.status(200).json({ msg: 'Tarea enviada a revisión correctamente.' })
  } catch (error) {
    console.error('Error al completar la tarea:', error)
    res.status(500).json({ msg: 'Hubo un error en el servidor.' })
  }
}

const revisarTarea = async (req, res) => {
  const { id } = req.params
  const { aprobado, comentarioRechazo } = req.body
  const jefe = req.user

  try {
    const tarea = await Tarea.findById(id).populate('asignadoA')

    if (!tarea) {
      return res.status(404).json({ msg: 'Tarea no encontrada.' })
    }

    if (tarea.creadoPor.toString() !== jefe._id.toString()) {
      return res.status(403).json({ msg: 'Acción no autorizada. No eres el creador de esta tarea.' })
    }

    if (tarea.estado !== 'en_revision') {
      return res.status(400).json({ msg: 'Esta tarea no está pendiente de revisión.' })
    }

    // Si hay una imagen, la borramos de Cloudinary en ambos casos (aprobado o rechazado)
    if (tarea.informeCompletado.imagenPublicId) {
      await deleteImage(tarea.informeCompletado.imagenPublicId)
    }

    if (aprobado) {
      tarea.estado = 'completada'
      const empleado = tarea.asignadoA
      empleado.xp += tarea.recompensaXP
      empleado.monedas += tarea.recompensaMonedas
      await empleado.save()
    } else {
      tarea.estado = 'pendiente' // La tarea vuelve a estar pendiente
      tarea.informeCompletado.comentarioRechazo = comentarioRechazo || 'La tarea fue rechazada. Por favor, revisa y vuelve a enviarla.'
    }

    // Limpiamos los campos del informe para la siguiente entrega
    tarea.informeCompletado.texto = undefined
    tarea.informeCompletado.urlImagen = undefined
    tarea.informeCompletado.imagenPublicId = undefined

    await tarea.save()

    const mensaje = aprobado ? 'Tarea aprobada. Recompensas entregadas.' : 'Tarea rechazada.'
    res.status(200).json({ msg: mensaje })
  } catch (error) {
    console.error('Error al revisar la tarea:', error)
    res.status(500).json({ msg: 'Hubo un error en el servidor.' })
  }
}

const listarTareasParaRevision = async (req, res) => {
  const jefe = req.user

  try {
    const tareas = await Tarea.find({ creadoPor: jefe._id, estado: 'en_revision' })
      .populate('asignadoA', 'nombre correo')
    res.status(200).json(tareas)
  } catch (error) {
    console.error('Error al listar tareas para revisión:', error)
    res.status(500).json({ msg: 'Hubo un error en el servidor.' })
  }
}

const recomendarTareas = async (req, res) => {
  const { emocion } = req.body
  const empleado = req.user

  if (!emocion) {
    return res.status(400).json({ msg: 'La emoción es necesaria para recomendar tareas.' })
  }

  let dificultadesRecomendadas = []

  // Lógica de recomendación simple
  switch (emocion) {
    case 'sadness':
    case 'fear':
    case 'anger':
      dificultadesRecomendadas = ['baja']
      break
    case 'joy':
    case 'surprise':
      dificultadesRecomendadas = ['media', 'alta']
      break
    default: // others, neutral
      dificultadesRecomendadas = ['baja', 'media']
  }

  try {
    const tareasRecomendadas = await Tarea.find({
      asignadoA: empleado._id,
      empresa: req.empresaId,
      estado: 'pendiente',
      dificultad: { $in: dificultadesRecomendadas }
    }).limit(5) // Limitar a 5 recomendaciones

    res.status(200).json(tareasRecomendadas)
  } catch (error) {
    console.error('Error al recomendar tareas:', error)
    res.status(500).json({ msg: 'Hubo un error en el servidor.' })
  }
}

export {
  crearTarea,
  editarTarea,
  eliminarTarea,
  listarMisTareas,
  completarTarea,
  revisarTarea,
  listarTareasParaRevision,
  listarTareasDeEmpleado,
  recomendarTareas
}
