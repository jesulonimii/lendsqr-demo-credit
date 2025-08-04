import { createController } from "@lib/fastify"
import ValidatePayload from "@helpers/payload-validator.helper"
import ApiResponse from "@utils/api-response.utils"
import * as authService from "./auth.service"
import Config from "@config"

export const createUser = createController(async (req, res) => {
	const { payload } = ValidatePayload({
		payload: req.body,
		schema: (z) => ({
			firstName: z.string().optional(),
			lastName: z.string().optional(),
			email: z.string(),
			password: z.string(),
		}),
	})

	const data = await authService.createUser(payload)
	const token = req.server.jwt.sign({ id: data.id, email: data.email }, { expiresIn: "1d" })

	res.setCookie("accessToken", token, {
		httpOnly: true,
		secure: "auto",
		maxAge: 24 * 60 * 60, // 1 day in seconds
	})

	return ApiResponse.success("User created successfully", {
		user: data,
		accessToken: token,
	})
})

export const loginUser = createController(async (req, res) => {
	const { payload } = ValidatePayload({
		payload: req.body,
		schema: (z) => ({
			email: z.string(),
			password: z.string(),
		}),
	})

	const data = await authService.loginUser(payload)
	const token = req.server.jwt.sign({ id: data.id, email: data.email }, { expiresIn: "1d" })

	res.setCookie("accessToken", token, {
		httpOnly: true,
		secure: "auto",
		maxAge: 24 * 60 * 60, // 1 day in seconds
	})

	return ApiResponse.success("Login successfully", {
		user: data,
		accessToken: token,
	})
})
