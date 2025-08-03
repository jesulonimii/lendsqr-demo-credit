import type { FastifyInstance } from "fastify"
import paginatePlugin from "@src/plugins/paginate.plugin"
import responseHandlerPlugin from "@src/plugins/response-handler.plugin"
import loggerPlugin from "@src/plugins/request-logger.plugin"
import fastifyJwt from "@fastify/jwt"
import fastifyEnv from "@fastify/env"
import fastifyCookie from "@fastify/cookie"
import fastifyCors from "@fastify/cors"
import fastifyMultipart from "@fastify/multipart"
import fastifyFormBody from "@fastify/formbody"

import { EnvConfig } from "@config"

export default async (fastify: FastifyInstance) => {
	await fastify.register(fastifyEnv, EnvConfig)
	fastify.register(fastifyJwt, { secret: fastify.config.JWT_SECRET })
	fastify.register(fastifyCookie, { secret: fastify.config.JWT_SECRET })
	fastify.register(fastifyCors, {})
	fastify.register(fastifyMultipart)
	fastify.register(fastifyFormBody)

	// custom plugins
	fastify.register(loggerPlugin)
	fastify.register(paginatePlugin)
	fastify.register(responseHandlerPlugin)
}
