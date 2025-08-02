import Empresa from '../models/Empresa.js'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'

const crearEmpresa = async (req, res) => {
  const { nombre, descripcion, direccion, telefono } = req.body
  const usuario = req.usuarioBDD

  if (!nombre) return res.status(400).json({ msg: 'El nombre de la empresa es obligatorio' })

  // Un empleado no puede crear una empresa, pero un jefe sí puede crear más de una.
  if (usuario.rol === 'empleado') {
    return res.status(403).json({ msg: 'No puedes crear una empresa si ya eres empleado de una.' })
  }

  try {
    const nuevaEmpresa = new Empresa({
      nombre,
      descripcion,
      direccion,
      telefono,
      creadoPor: usuario._id,
      empleados: [usuario._id]
    })

    await nuevaEmpresa.save()

    // Si el usuario era 'usuario', ahora se convierte en 'jefe'. Si ya era 'jefe', no cambia.
    if (usuario.rol === 'usuario') {
      usuario.rol = 'jefe'
    }
    await usuario.save()

    res.status(201).json({
      msg: 'Empresa creada correctamente',
      empresa: nuevaEmpresa
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: 'Error al crear empresa' })
  }
}

// Ver empleados de una empresa (solo el jefe)
const verEmpleados = async (req, res) => {
  const usuario = req.usuarioBDD

  // Solo el jefe puede ver los empleados
  if (usuario.rol !== 'jefe') {
    return res.status(403).json({ msg: 'Solo el administrador puede ver a los empleados' })
  }

  // Si es jefe, debe haber seleccionado una empresa para trabajar
  if (!req.empresaId) {
    return res.status(400).json({ msg: 'Debes seleccionar una empresa para realizar esta acción.' })
  }

  try {
    const empresa = await Empresa.findById(req.empresaId).populate('empleados', '-contrasena -token -__v')

    // Doble verificación: que la empresa exista y que el usuario sea el creador
    if (!empresa) return res.status(404).json({ msg: 'Empresa no encontrada' })
    if (empresa.creadoPor.toString() !== usuario._id.toString()) return res.status(403).json({ msg: 'Acción no válida' })

    res.status(200).json(empresa.empleados)
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: 'Error al obtener empleados' })
  }
}

// Unirse a empresa con token de invitación
const unirseAEmpresa = async (req, res) => {
  const { token } = req.body
  const usuario = req.usuarioBDD

  if (usuario.rol === 'jefe') {
    return res.status(403).json({ msg: 'Un administrador no puede unirse a otra empresa' })
  }

  try {
    const empresa = await Empresa.findOne({ tokenInvitacion: token })
    if (!empresa) return res.status(404).json({ msg: 'Token de invitación inválido' })

    // Verificar que no esté ya unido
    if (empresa.empleados.includes(usuario._id)) {
      return res.status(400).json({ msg: 'Ya perteneces a esta empresa' })
    }

    empresa.empleados.push(usuario._id)
    await empresa.save()

    usuario.rol = 'empleado'
    await usuario.save()

    res.status(200).json({ msg: 'Te has unido exitosamente a la empresa' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: 'Error al unirse a la empresa' })
  }
}

// Actualizar info de la empresa (solo jefe)
const actualizarEmpresa = async (req, res) => {
  const usuario = req.usuarioBDD
  const { nombre, descripcion, direccion, telefono } = req.body

  if (usuario.rol !== 'jefe') {
    return res.status(403).json({ msg: 'Solo el propietario puede actualizar la empresa' })
  }

  // Si es jefe, debe haber seleccionado una empresa para trabajar
  if (!req.empresaId) {
    return res.status(400).json({ msg: 'Debes seleccionar una empresa para realizar esta acción.' })
  }

  try {
    const empresa = await Empresa.findById(req.empresaId)

    // Doble verificación: que la empresa exista y que el usuario sea el creador
    if (!empresa) return res.status(404).json({ msg: 'Empresa no encontrada' })
    if (empresa.creadoPor.toString() !== usuario._id.toString()) return res.status(403).json({ msg: 'Acción no válida' })

    empresa.nombre = nombre ?? empresa.nombre
    empresa.descripcion = descripcion ?? empresa.descripcion
    empresa.direccion = direccion ?? empresa.direccion
    empresa.telefono = telefono ?? empresa.telefono

    await empresa.save()

    res.status(200).json({ msg: 'Empresa actualizada', empresa })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: 'Error al actualizar empresa' })
  }
}

// Ver los datos de la empresa del usuario (admin o empleado)
const verMiEmpresa = async (req, res) => {
  const usuario = req.usuarioBDD

  try {
    let empresa

    if (usuario.rol === 'jefe') {
      // Si es jefe, debe haber seleccionado una empresa para ver sus datos
      if (!req.empresaId) {
        return res.status(400).json({ msg: 'Debes seleccionar una empresa para ver sus detalles. Usa el endpoint para listar tus empresas.' })
      }
      empresa = await Empresa.findById(req.empresaId).populate('empleados', 'nombre correo')
      // Verificamos que sea el propietario
      if (empresa && empresa.creadoPor.toString() !== usuario._id.toString()) return res.status(403).json({ msg: 'Acción no válida' })
    } else if (usuario.rol === 'empleado') {
      empresa = await Empresa.findOne({ empleados: usuario._id }).populate('empleados', 'nombre correo')
    } else {
      return res.status(403).json({ msg: 'No estás asociado a ninguna empresa' })
    }

    if (!empresa) return res.status(404).json({ msg: 'Empresa no encontrada' })

    res.status(200).json(empresa)
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: 'Error al obtener empresa' })
  }
}

// Listar todas las empresas de un jefe
const listarMisEmpresas = async (req, res) => {
  const usuario = req.usuarioBDD

  if (usuario.rol !== 'jefe') {
    return res.status(403).json({ msg: 'Solo los propietarios de empresas pueden realizar esta acción' })
  }

  try {
    const empresas = await Empresa.find({ creadoPor: usuario._id }).select('nombre descripcion direccion')
    if (!empresas || empresas.length === 0) {
      return res.status(404).json({ msg: 'No has creado ninguna empresa aún' })
    }
    res.status(200).json(empresas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: 'Error al listar tus empresas' })
  }
}

// Seleccionar una empresa para administrar (solo jefe)
const seleccionarEmpresa = async (req, res) => {
  const { id } = req.params // El ID de la empresa a seleccionar
  const usuario = req.usuarioBDD

  if (usuario.rol !== 'jefe') {
    return res.status(403).json({ msg: 'Acción no permitida' })
  }

  try {
    const empresa = await Empresa.findById(id)
    if (!empresa) return res.status(404).json({ msg: 'Empresa no encontrada' })

    // Verificar que el usuario es el propietario de la empresa que quiere seleccionar
    if (empresa.creadoPor.toString() !== usuario._id.toString()) {
      return res.status(403).json({ msg: 'No eres el propietario de esta empresa' })
    }

    // Generar un nuevo token que incluya el ID de la empresa seleccionada
    const payload = {
      id: usuario._id,
      rol: usuario.rol,
      empresaId: empresa._id // Se añade el ID de la empresa al payload del token
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' })

    res.status(200).json({
      msg: `Has seleccionado la empresa: ${empresa.nombre}. Usa el nuevo token para las siguientes peticiones.`,
      token
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: 'Error al seleccionar la empresa' })
  }
}

// Eliminar una empresa (solo el propietario)
const eliminarEmpresa = async (req, res) => {
  const { id } = req.params // ID de la empresa a eliminar
  const usuario = req.usuarioBDD

  if (usuario.rol !== 'jefe') {
    return res.status(403).json({ msg: 'Solo los propietarios pueden eliminar empresas.' })
  }

  try {
    const empresa = await Empresa.findById(id)

    if (!empresa) {
      return res.status(404).json({ msg: 'Empresa no encontrada.' })
    }

    // Verificar que el usuario es el propietario de la empresa
    if (empresa.creadoPor.toString() !== usuario._id.toString()) {
      return res.status(403).json({ msg: 'Acción no autorizada. No eres el propietario de esta empresa.' })
    }

    // 1. Revertir el rol de los empleados a 'usuario' (excluyendo al propietario)
    const idEmpleados = empresa.empleados.filter(
      (empleadoId) => empleadoId.toString() !== usuario._id.toString()
    )

    if (idEmpleados.length > 0) {
      await User.updateMany({ _id: { $in: idEmpleados } }, { $set: { rol: 'usuario' } })
    }

    // 2. Eliminar la empresa
    await empresa.deleteOne()

    // 3. Verificar si el jefe tiene más empresas. Si no, revertir su rol a 'usuario'.
    const otrasEmpresas = await Empresa.countDocuments({ creadoPor: usuario._id })
    if (otrasEmpresas === 0) {
      await User.findByIdAndUpdate(usuario._id, { rol: 'usuario' })
    }

    res.status(200).json({ msg: 'Empresa eliminada correctamente. Los empleados han sido desvinculados.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: 'Error en el servidor al eliminar la empresa.' })
  }
}

// Generar/regenerar un código de invitación para la empresa activa (solo propietario)
const generarCodigoInvitacion = async (req, res) => {
  const usuario = req.usuarioBDD

  if (usuario.rol !== 'jefe') {
    return res.status(403).json({ msg: 'Solo los propietarios pueden generar códigos de invitación.' })
  }

  if (!req.empresaId) {
    return res.status(400).json({ msg: 'Debes seleccionar una empresa para generar un código.' })
  }

  try {
    const empresa = await Empresa.findById(req.empresaId)

    if (!empresa) return res.status(404).json({ msg: 'Empresa no encontrada.' })

    if (empresa.creadoPor.toString() !== usuario._id.toString()) {
      return res.status(403).json({ msg: 'Acción no autorizada.' })
    }

    // Generamos un nuevo código aleatorio y lo guardamos
    empresa.tokenInvitacion = Math.random().toString(36).substring(2, 10)
    await empresa.save()

    res.status(200).json({ msg: 'Nuevo código de invitación generado.', codigo: empresa.tokenInvitacion })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: 'Error en el servidor al generar el código.' })
  }
}

// Expulsar a un empleado de la empresa (solo propietario)
const expulsarEmpleado = async (req, res) => {
  const { id } = req.params // ID del empleado a expulsar
  const usuarioJefe = req.usuarioBDD

  if (usuarioJefe.rol !== 'jefe') {
    return res.status(403).json({ msg: 'Solo los propietarios pueden gestionar empleados.' })
  }

  if (!req.empresaId) {
    return res.status(400).json({ msg: 'Debes seleccionar una empresa para realizar esta acción.' })
  }

  try {
    const empresa = await Empresa.findById(req.empresaId)
    if (!empresa) return res.status(404).json({ msg: 'Empresa no encontrada.' })

    // Verificar que el jefe es el propietario
    if (empresa.creadoPor.toString() !== usuarioJefe._id.toString()) {
      return res.status(403).json({ msg: 'Acción no autorizada.' })
    }

    // Un jefe no se puede expulsar a sí mismo
    if (usuarioJefe._id.toString() === id) {
      return res.status(400).json({ msg: 'No puedes expulsarte a ti mismo de la empresa.' })
    }

    // 1. Quitar al empleado del array de la empresa
    empresa.empleados.pull(id)
    await empresa.save()

    // 2. Cambiar el rol del usuario expulsado a 'usuario'
    await User.findByIdAndUpdate(id, { rol: 'usuario' })

    res.status(200).json({ msg: 'Empleado desvinculado de la empresa correctamente.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: 'Error en el servidor al desvincular al empleado.' })
  }
}

export {
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
}
