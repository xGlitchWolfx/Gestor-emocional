import jwt from "jsonwebtoken"
import User from "../models/User.js"

const crearTokenJWT = (id, rol) => {
  return jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

const verificarTokenJWT = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization)
    return res.status(401).json({ msg: "Acceso denegado: token no proporcionado o inválido" });

  try {
    const token = authorization.split(" ")[1];
    const { id, rol } = jwt.verify(token, process.env.JWT_SECRET);

    req.usuarioBDD = await User.findById(id); // No excluyas la contraseña

    next();
  } catch (error) {
    return res.status(401).json({ msg: "Token inválido o expirado" });
  }
};

export {
  crearTokenJWT,
  verificarTokenJWT
};
