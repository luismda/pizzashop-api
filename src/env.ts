import { z } from 'zod'

const envSchema = z.object({
  API_BASE_URL: z.string().url(),
  AUTH_REDIRECT_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  JWT_SECRET_KEY: z.string(),
})

export const env = envSchema.parse(process.env)
