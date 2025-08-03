import { createController } from "@lib/fastify"
import ValidatePayload from "@helpers/payload-validator.helper"
import ApiResponse from "@utils/api-response.utils"
import * as userService from "./user.service"

export const createUser = createController(async (req, res) => {
	const { payload } = ValidatePayload({
		payload: req.body,
		schema: (z) => ({
			firstName: z.string(),
			lastName: z.string(),
			phoneNumber: z.string(),
		}),
	})

	const data = await userService.createUser(payload)
	return ApiResponse.success("User created successfully", data)
})
