import express from 'express'
import { crearIntentoDePago } from '../controllers/pagoController.js'
import passport from 'passport'

const router = express.Router()

router.use(passport.authenticate('jwt', { session: false }))

router.post('/crear-intento-pago', crearIntentoDePago)

export default router