import type { FastifyInstance } from "fastify"
import ApiResponse from "@utils/api-response.utils"
import authRoutes from "./auth"

const routes: Record<string, any> = {
	"/auth": authRoutes,
}

export default (fastify: FastifyInstance) => {
	Object.entries(routes).forEach(([path, route]) => {
		fastify.register(route, { prefix: path })
	})
	fastify.get("/", async (request, reply) => {
		return ApiResponse.success("Welcome to the demo credit api")
	})
}
