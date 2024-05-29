import Elysia, { t } from 'elysia'
import { createId } from '@paralleldrive/cuid2'

import { env } from '../../env'
import { db } from '../../db/connection'
import { authLinks } from '../../db/schema'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const sendAuthLink = new Elysia().post(
  '/authenticate',
  async ({ body, set }) => {
    const { email } = body

    const userFromEmail = await db.query.users.findFirst({
      where(fields, { eq }) {
        return eq(fields.email, email)
      },
    })

    if (!userFromEmail) {
      throw new UnauthorizedError()
    }

    const authLinkCode = createId()

    await db.insert(authLinks).values({
      userId: userFromEmail.id,
      code: authLinkCode,
    })

    const authLink = new URL('/auth-links/authenticate', env.API_BASE_URL)

    authLink.searchParams.set('code', authLinkCode)
    authLink.searchParams.set('redirect', env.AUTH_REDIRECT_URL)

    console.log(authLink.toString())

    set.status = 204
  },
  {
    body: t.Object({
      email: t.String({ format: 'email' }),
    }),
  },
)
