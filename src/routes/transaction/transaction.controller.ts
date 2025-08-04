import { createController } from "@lib/fastify"
import * as transactionService from "@routes/transaction/transaction.service"
import ApiResponse from "@utils/api-response.utils"
import ValidatePayload from "@helpers/payload-validator.helper"

export const getTransactions = createController(async (req, res) => {

	const { payload: filter } = ValidatePayload({
		payload: req?.query,
		schema: (z) => ({
			filter: z.object({
				limit: z.number().optional(),
				page: z.number().optional(),
				sortBy: z.string().optional(),
				sortOrder: z.enum(["asc", "desc"]).optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}).optional(),
		}),
	})

	const { data, meta } = await transactionService.getTransactions(req.user.id, filter, req.pagination)

	return ApiResponse.success("transactions fetched successfully", data, 200, meta)
})

export const deposit = createController(async (req, res) => {
	const { payload } = ValidatePayload({
		schema: z => ({
			amount: z.coerce.number().positive().int().min(100).max(1000000),
			narration: z.string().optional().default("Deposit"),
		}),
		payload: req?.body,
	})

	const data = await transactionService.deposit(req.user.id, payload)

	return ApiResponse.success("Deposit successful", data)
})

export const withdraw = createController(async (req, res) => {
	const { payload } = ValidatePayload({
		schema: z => ({
			amount: z.coerce.number().positive().int().min(100).max(1000000),
		}),
		payload: req?.body,
	})

	const data = await transactionService.withdraw(req.user.id, payload)

	return ApiResponse.success("Withdrawal successful", data)
})

export const transfer = createController(async (req, res) => {
	const { payload } = ValidatePayload({
		schema: z => ({
			amount: z.coerce.number().positive().int().min(100).max(1000000),
			counterpartyId: z.string(),
			narration: z.string().optional(),
		}),
		payload: req?.body,
	})

	const data = await transactionService.transfer(req.user.id, payload)

	return ApiResponse.success("Transfer successful", data)
})
