import type { FastifyInstance } from "fastify"
import * as authController from "./auth.controller"

export default async function(router: FastifyInstance) {
	router.post("/register", authController.createUser)
	router.post("/login", authController.loginUser)
}
