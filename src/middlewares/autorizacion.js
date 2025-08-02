export const esJefe = (req, res, next) => {
  if (req.user?.rol === 'jefe') {
    return next()
  }
  return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Jefe.' })
}

export const esEmpleado = (req, res, next) => {
  if (req.user?.rol === 'empleado') {
    return next()
  }
  return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Empleado.' })
}

export const esRol = (...roles) => (req, res, next) => {
  if (roles.includes(req.user?.rol)) {
    return next()
  }
  return res.status(403).json({ msg: 'Acceso denegado. No tienes los permisos necesarios.' })
}