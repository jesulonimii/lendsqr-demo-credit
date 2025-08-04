import type { FastifyInstance } from "fastify"
import ApiResponse from "@utils/api-response.utils"

const routes: Record<string, any> = {
	"/auth": import("./auth"),
	"/transaction": import("./transaction"),
}

export default (fastify: FastifyInstance) => {
	Object.entries(routes).forEach(([path, route]) => {
		fastify.register(route, { prefix: path })
	})
	fastify.get("/", async (request, reply) => {
		return ApiResponse.success("Welcome to the demo credit api")
	})
}
