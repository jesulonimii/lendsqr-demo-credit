import type { FastifyInstance } from "fastify"
import ApiResponse from "@utils/api-response.utils"

import chatRoutes from "./chat"
import userRoutes from "./users"
import webhookRoutes from "./webhook"
import googleAuthRoutes from "./google-auth"

export default (fastify: FastifyInstance) => {
	fastify.register(userRoutes, { prefix: "/users" })
	fastify.register(chatRoutes, { prefix: "/chat" })
	fastify.register(webhookRoutes, { prefix: "/webhook" })
	fastify.register(googleAuthRoutes)
	fastify.get("/", async (request, reply) => {
		return ApiResponse.success("Welcome to the Innbode API")
	})
}
