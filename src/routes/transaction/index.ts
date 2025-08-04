import type { FastifyInstance } from "fastify"
import * as transactionsController from "./transaction.controller"

export default async function(router: FastifyInstance) {
	router.addHook("preHandler", router.authenticate)
	router.get("/", transactionsController.getTransactions)
	router.post("/deposit", transactionsController.deposit)
	router.post("/withdraw", transactionsController.withdraw)
	router.post("/transfer", transactionsController.transfer)
}
