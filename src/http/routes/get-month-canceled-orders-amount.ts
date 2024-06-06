import dayjs from 'dayjs'
import Elysia from 'elysia'
import { and, count, eq, gte, sql } from 'drizzle-orm'

import { auth } from '../auth'
import { db } from '../../db/connection'
import { orders } from '../../db/schema'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const getMonthCanceledOrdersAmount = new Elysia()
  .use(auth)
  .get('/metrics/month-canceled-orders-amount', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const today = dayjs()
    const lastMonth = today.subtract(1, 'month')
    const startOfLastMonth = lastMonth.startOf('month')

    const canceledOrdersPerMonth = await db
      .select({
        amount: count(),
        monthWithYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          eq(orders.status, 'canceled'),
          gte(orders.createdAt, startOfLastMonth.toDate()),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`)

    const currentMonthWithYear = today.format('YYYY-MM')
    const lastMonthWithYear = lastMonth.format('YYYY-MM')

    const currentMonthCanceledOrdersAmount = canceledOrdersPerMonth.find(
      (canceledOrderPerMonth) => {
        return canceledOrderPerMonth.monthWithYear === currentMonthWithYear
      },
    )

    const lastMonthCanceledOrdersAmount = canceledOrdersPerMonth.find(
      (canceledOrderPerMonth) => {
        return canceledOrderPerMonth.monthWithYear === lastMonthWithYear
      },
    )

    const diffFromLastMonth =
      currentMonthCanceledOrdersAmount && lastMonthCanceledOrdersAmount
        ? (currentMonthCanceledOrdersAmount.amount * 100) /
          lastMonthCanceledOrdersAmount.amount
        : null

    return {
      amount: currentMonthCanceledOrdersAmount?.amount,
      diffFromLastMonth: diffFromLastMonth
        ? Number((diffFromLastMonth - 100).toFixed(2))
        : 0,
    }
  })
