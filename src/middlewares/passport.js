import dotenv from 'dotenv';
dotenv.config();

import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
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

export default passport;
