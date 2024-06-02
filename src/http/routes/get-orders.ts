import Elysia, { t } from 'elysia'
import { createSelectSchema } from 'drizzle-typebox'
import { and, count, desc, eq, getTableColumns, ilike, sql } from 'drizzle-orm'

import { auth } from '../auth'
import { db } from '../../db/connection'
import { orders, users } from '../../db/schema'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const getOrders = new Elysia().use(auth).get(
  '/orders',
  async ({ getCurrentUser, query }) => {
    const { restaurantId } = await getCurrentUser()
    const { customerName, orderId, status, pageIndex } = query

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const ordersTableColumns = getTableColumns(orders)

    const baseQuery = db
      .select({
        ...ordersTableColumns,
        customerName: users.name,
      })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.customerId))
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          customerName ? ilike(users.name, `%${customerName}%`) : undefined,
          orderId ? ilike(orders.id, `%${orderId}%`) : undefined,
          status ? eq(orders.status, status) : undefined,
        ),
      )

    const [ordersCountResult, ordersResult] = await Promise.all([
      db.select({ count: count() }).from(baseQuery.as('baseQuery')),
      db
        .select()
        .from(baseQuery.as('baseQuery'))
        .offset(pageIndex * 10)
        .limit(10)
        .orderBy((fields) => {
          return [
            sql`
              CASE ${fields.status}
                WHEN 'pending' THEN 1
                WHEN 'processing' THEN 2
                WHEN 'delivering' THEN 3
                WHEN 'delivered' THEN 4
                WHEN 'canceled' THEN 99
              END
            `,
            desc(fields.createdAt),
          ]
        }),
    ])

    const ordersCount = ordersCountResult[0].count

    return {
      orders: ordersResult,
      meta: {
        pageIndex,
        perPage: 10,
        totalCount: ordersCount,
      },
    }
  },
  {
    query: t.Object({
      customerName: t.Optional(t.String()),
      orderId: t.Optional(t.String()),
      status: t.Optional(createSelectSchema(orders).properties.status),
      pageIndex: t.Numeric({ minimum: 0 }),
    }),
  },
)
