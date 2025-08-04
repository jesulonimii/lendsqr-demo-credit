import { z } from "zod-v4"
import { type EnvSchemaOpt } from "env-schema"

const schema = z.object({
	PORT: z.coerce.number().default(3000),
	ENV: z.enum(["development", "production", "staging"]).default("development"),
	DB_URL: z.string(),
	JWT_SECRET: z.string().default("secret"),
	COOKIE_AGE: z.coerce.number().default(3600000),
	BASE_URL: z.string().default("http://localhost:3550"),
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

export default EnvConfig
