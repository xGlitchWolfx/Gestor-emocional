import jwt from "jsonwebtoken"
import User from "../models/User.js"
import Empresa from "../models/Empresa.js"

// Crear token JWT con empresaId si aplica
const crearTokenJWT = async (id, rol) => {
  let empresaId = null

  if (rol === 'jefe') {
    const empresas = await Empresa.find({ creadoPor: id }).select('_id')
    if (empresas.length === 1) {
      empresaId = empresas[0]._id
    }
  }

  if (rol === 'empleado') {
    const empresa = await Empresa.findOne({ empleados: id })
    if (empresa) empresaId = empresa._id
  }

  const payload = { id, rol, empresaId }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" })
}

const verificarTokenJWT = async (req, res, next) => {
  const { authorization } = req.headers

  if (!authorization)
    return res.status(401).json({ msg: "Acceso denegado: token no proporcionado o inválido" })

  try {
    const token = authorization.split(" ")[1]
    const { id, rol, empresaId } = jwt.verify(token, process.env.JWT_SECRET)

    const usuario = await User.findById(id)

    if (!usuario)
      return res.status(404).json({ msg: "Usuario no encontrado" })

    req.usuarioBDD = usuario
    req.rol = rol
    req.empresaId = empresaId

    next()
  } catch (error) {
    return res.status(401).json({ msg: "Token inválido o expirado" })
  }
}

export {
  crearTokenJWT,
  verificarTokenJWT
}
