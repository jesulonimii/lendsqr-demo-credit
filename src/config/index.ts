import { z } from "zod-v4"
import { type EnvSchemaOpt } from "env-schema"

const schema = z.object({
	PORT: z.coerce.number().default(3000),
	ENV: z.enum(["development", "production", "staging"]).default("development"),
	MONGODB_URI: z.string().default("mongodb://localhost:27017/innbode"),
	MYSQL_DATABASE_URL: z.string(),
	JWT_SECRET: z.string().default("secret"),
	COOKIE_AGE: z.coerce.number().default(3600000),
	OPENAI_API_KEY: z.string(),
	OPENAI_ORGANIZATION_ID: z.string(),
	INNBODE_ASSISTANT_ID: z.string().default("---"),
	BASE_URL: z.string().default("http://localhost:3550"),
	VOLTAGENT_DATABASE_TYPE: z.enum(["mongodb", "memory"]).default("mongodb"),
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
