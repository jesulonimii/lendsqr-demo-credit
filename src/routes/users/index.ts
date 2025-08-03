import type { FastifyInstance } from "fastify"
import * as userController from "./users.controller"

export default async function(router: FastifyInstance) {
	router.post("/", userController.createUser)
}
