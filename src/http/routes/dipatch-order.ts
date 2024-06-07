import Elysia, { t } from 'elysia'
import { eq } from 'drizzle-orm'

import { auth } from '../auth'
import { db } from '../../db/connection'
import { orders } from '../../db/schema'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const dispatchOrder = new Elysia().use(auth).patch(
  '/orders/:orderId/dispatch',
  async ({ getCurrentUser, params, set }) => {
    const { orderId } = params
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const order = await db.query.orders.findFirst({
      where(fields, { and, eq }) {
        return and(
          eq(fields.id, orderId),
          eq(fields.restaurantId, restaurantId),
        )
      },
    })

    if (!order) {
      set.status = 400
      return { message: 'Order not found.' }
    }

    if (order.status !== 'processing') {
      set.status = 400
      return { message: 'You cannot dispatch orders that is not processing.' }
    }

    await db
      .update(orders)
      .set({ status: 'delivering' })
      .where(eq(orders.id, orderId))

    set.status = 204
  },
  {
    params: t.Object({
      orderId: t.String(),
    }),
  },
)
