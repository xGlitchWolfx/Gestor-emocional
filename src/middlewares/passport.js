import dotenv from 'dotenv';
dotenv.config();

import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET, 
  passReqToCallback: true,
};

passport.use(new JwtStrategy(opts, async (req, jwt_payload, done) => {
  try {
    const usuario = await User.findById(jwt_payload.id).select('-contrasena -token -confirmEmail');

    if (usuario) {
      req.rol = jwt_payload.rol;
      req.empresaId = jwt_payload.empresaId;
      return done(null, usuario);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Serialización y Deserialización de usuario para la sesión de OAuth
passport.serializeUser((usuario, done) => {
  done(null, usuario.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const usuario = await User.findById(id);
    done(null, usuario);
  } catch (error) {
    done(error, false);
  }
});

// Estrategia de Google - CORREGIDA
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL // Usar la variable de entorno
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const correo = profile.emails[0].value;
    let usuario = await User.findOne({ googleId: profile.id });

    if (usuario) return done(null, usuario);

    // Si no existe por googleId, buscar por correo para vincular cuentas
    usuario = await User.findOne({ correo });
    if (usuario) {
      usuario.googleId = profile.id;
      usuario.confirmEmail = true;
      await usuario.save();
      return done(null, usuario);
    }

    // Si no existe, crear un nuevo usuario
    const nuevoUsuario = new User({
      nombre: profile.displayName,
      correo,
      googleId: profile.id,
      confirmEmail: true,
      rol: 'usuario'
    });
    await nuevoUsuario.save();
    return done(null, nuevoUsuario);
  } catch (error) {
    return done(error, false);
  }
}));

export default passport;