import { z } from "zod-v4"
import { type EnvSchemaOpt } from "env-schema"

const schema = z.object({
	PORT: z.coerce.number().default(3000),
	ENV: z.enum(["development", "production", "staging"]).default("development"),
	DB_URL: z.string(),
	JWT_SECRET: z.string().default("secret"),
	COOKIE_AGE: z.coerce.number().default(3600000),
	BASE_URL: z.string().default("http://localhost:3550"),
	ADMIN_ACCOUNT_ID: z.string().default("d91481ed-168f-4c31-826b-7db21f98bab6"),
})

export const EnvConfig: EnvSchemaOpt = {
	schema: z.toJSONSchema(schema),
	dotenv: true,
}

declare module "fastify" {
	interface FastifyInstance {
		config: z.infer<typeof schema>
	}
}

export const Config = schema.parse(process.env)

export default Config
