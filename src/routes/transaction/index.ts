import type { FastifyInstance } from "fastify"
import * as transactionsController from "./transactions.controller"

export default async function(router: FastifyInstance) {
	router.addHook("preHandler", router.authenticate)
	router.get("/", transactionsController.getTransactions)

}
