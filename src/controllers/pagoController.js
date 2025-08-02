import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const crearIntentoDePago = async (req, res) => {
  const { amount } = req.body;
  const usuario = req.user;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ msg: 'La cantidad (amount) es inválida.' })
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), 
      currency: 'usd',
      metadata: {
        userId: usuario._id.toString()
      },
      automatic_payment_methods: {
        enabled: true
      }
    })

    res.status(200).json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error('Error al crear el intento de pago:', error)
    res.status(500).json({ msg: 'Error al procesar el pago.', error: error.message })
  }
}

export { crearIntentoDePago }