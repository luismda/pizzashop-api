import dayjs from 'dayjs'
import Elysia from 'elysia'
import { and, count, eq, gte, sql } from 'drizzle-orm'

import { auth } from '../auth'
import { db } from '../../db/connection'
import { orders } from '../../db/schema'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const getDayOrderAmount = new Elysia()
  .use(auth)
  .get('/metrics/day-orders-amount', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const today = dayjs()
    const yesterday = today.subtract(1, 'day')
    const startOfYesterday = yesterday.startOf('day')

    const ordersPerDay = await db
      .select({
        amount: count(),
        dayWithMonthAndYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, startOfYesterday.toDate()),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`)

    const todayWithMonthAndYear = today.format('YYYY-MM-DD')
    const yesterdayWithMonthAndYear = yesterday.format('YYYY-MM-DD')

    const todayOrdersAmount = ordersPerDay.find((orderPerDay) => {
      return orderPerDay.dayWithMonthAndYear === todayWithMonthAndYear
    })

    const yesterdayOrdersAmount = ordersPerDay.find((orderPerDay) => {
      return orderPerDay.dayWithMonthAndYear === yesterdayWithMonthAndYear
    })

    const diffFromYesterday =
      todayOrdersAmount && yesterdayOrdersAmount
        ? (todayOrdersAmount.amount * 100) / yesterdayOrdersAmount.amount
        : null

    return {
      amount: todayOrdersAmount?.amount,
      diffFromYesterday: diffFromYesterday
        ? Number((diffFromYesterday - 100).toFixed(2))
        : 0,
    }
  })
