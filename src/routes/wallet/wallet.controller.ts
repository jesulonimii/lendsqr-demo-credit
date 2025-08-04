import { createController } from "@lib/fastify"
import * as walletService from "@routes/wallet/wallet.service"
import ApiResponse from "@utils/api-response.utils"
import ValidatePayload from "@helpers/payload-validator.helper"

export const getBalance = createController(async (req, res) => {

	const data = await walletService.getBalance(req.user.id)

	return ApiResponse.success("Wallet fetched successfully", data)
})

