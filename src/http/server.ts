import { Elysia, NotFoundError } from 'elysia'

import { signOut } from './routes/sign-out'
import { getProfile } from './routes/get-profile'
import { cancelOrder } from './routes/cancel-order'
import { approveOrder } from './routes/approve-order'
import { deliverOrder } from './routes/deliver-order'
import { sendAuthLink } from './routes/send-auth-link'
import { dispatchOrder } from './routes/dipatch-order'
import { getOrderDetails } from './routes/get-order-details'
import { registerRestaurant } from './routes/register-restaurant'
import { authenticateFromLink } from './routes/authenticate-from-link'
import { getManagedRestaurant } from './routes/get-managed-restaurant'

const app = new Elysia()
  .use(sendAuthLink)
  .use(authenticateFromLink)
  .use(registerRestaurant)
  .use(signOut)
  .use(getProfile)
  .use(getManagedRestaurant)
  .use(getOrderDetails)
  .use(approveOrder)
  .use(cancelOrder)
  .use(deliverOrder)
  .use(dispatchOrder)
  .error({
    RESOURCE_NOT_FOUND: NotFoundError,
  })
  .onError(({ error, code, set }) => {
    switch (code) {
      case 'RESOURCE_NOT_FOUND': {
        set.status = 404
        return { code, message: error.message }
      }
      case 'VALIDATION': {
        set.status = 400
        return { code, message: error.message, error: error.toResponse() }
      }
      default: {
        console.error(error)

        return new Response(null, { status: 500 })
      }
    }
  })

app.listen(3333, () => {
  console.log('🔥 HTTP server running!')
})
