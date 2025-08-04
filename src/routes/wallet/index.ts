import type { FastifyInstance } from "fastify"
import * as walletController from "./wallet.controller"

export default async function(router: FastifyInstance) {
	router.addHook("preHandler", router.authenticate)
	router.get("/balance", walletController.getBalance)
	router.post("/deposit", walletController.deposit)
	router.post("/withdraw", walletController.withdraw)
	router.post("/transfer", walletController.transfer)
}
