/* eslint-disable drizzle/enforce-delete-with-where */

import { faker } from '@faker-js/faker'
import {
  users,
  restaurants,
  authLinks,
  orderItems,
  orders,
  products,
} from './schema'
import { db } from './connection'
import chalk from 'chalk'
import { createId } from '@paralleldrive/cuid2'

/**
 * Reset database
 */
await db.delete(users)
await db.delete(authLinks)
await db.delete(restaurants)
await db.delete(orderItems)
await db.delete(orders)
await db.delete(products)

console.log(chalk.yellow('\n✔︎ Database reset.'))

/**
 * Create customers
 */
const [customerOne, customerTwo] = await db
  .insert(users)
  .values([
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: 'customer',
    },
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: 'customer',
    },
  ])
  .returning()

console.log(chalk.yellow('✔︎ Created customers.'))

/**
 * Create manager
 */
const [manager] = await db
  .insert(users)
  .values([
    {
      name: faker.person.fullName(),
      email: 'admin@admin.com',
      role: 'manager',
    },
  ])
  .returning({
    id: users.id,
  })

console.log(chalk.yellow('✔︎ Created manager.'))

/**
 * Create restaurant
 */
const [restaurant] = await db
  .insert(restaurants)
  .values([
    {
      name: faker.company.name(),
      description: faker.lorem.paragraph(),
      managerId: manager.id,
    },
  ])
  .returning()

console.log(chalk.yellow('✔︎ Created restaurant.'))

/**
 * Create products
 */
function generateProduct() {
  return {
    restaurantId: restaurant.id,
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    priceInCents: Number(faker.commerce.price({ min: 190, max: 490, dec: 0 })),
  }
}

const availableProducts = await db
  .insert(products)
  .values([
    generateProduct(),
    generateProduct(),
    generateProduct(),
    generateProduct(),
    generateProduct(),
    generateProduct(),
  ])
  .returning()

console.log(chalk.yellow('✔︎ Created products.'))

/**
 * Create orders
 */

type OrderItemsInsert = typeof orderItems.$inferInsert
type OrderInsert = typeof orders.$inferInsert

const orderItemsToInsert: OrderItemsInsert[] = []
const orderToInsert: OrderInsert[] = []

for (let i = 0; i < 200; i++) {
  const orderId = createId()

  const orderProducts = faker.helpers.arrayElements(availableProducts, {
    min: 1,
    max: 3,
  })

  let totalInCents = 0

  orderProducts.forEach((orderProduct) => {
    const quantity = faker.number.int({ min: 1, max: 3 })

    totalInCents += orderProduct.priceInCents * quantity

    orderItemsToInsert.push({
      orderId,
      quantity,
      productId: orderProduct.id,
      priceInCents: orderProduct.priceInCents,
    })
  })

  orderToInsert.push({
    id: orderId,
    totalInCents,
    restaurantId: restaurant.id,
    customerId: faker.helpers.arrayElement([customerOne.id, customerTwo.id]),
    status: faker.helpers.arrayElement([
      'pending',
      'processing',
      'delivering',
      'delivered',
      'canceled',
    ]),
    createdAt: faker.date.recent({ days: 40 }),
  })
}

await db.insert(orders).values(orderToInsert)
await db.insert(orderItems).values(orderItemsToInsert)

console.log(chalk.yellow('✔︎ Created orders.'))

console.log(chalk.greenBright('\n🌱 Database seeded successfully!\n'))

process.exit()
