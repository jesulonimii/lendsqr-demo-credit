import {
	BAD_REQUEST,
	FORBIDDEN,
	INTERNAL_SERVER_ERROR,
	NOT_FOUND,
	UNAUTHORIZED,
} from "@src/config/status-codes.constants"
import type { StatusCode } from "@helpers/service-error.helper"

class ApiResponseClass {
	badRequest(message: string, extra?: object) {
		this.response(BAD_REQUEST, message, extra)
		return
	}

	forbidden(message: string, extra?: object) {
		this.response(FORBIDDEN, message, extra)
		return
	}

	notFound(message: string, extra?: object) {
		this.response(NOT_FOUND, message, extra)
		return
	}

	internalServerError(message: string, extra?: object) {
		this.response(INTERNAL_SERVER_ERROR, message, extra)
		return
	}

	unauthorized(message: string, extra?: object) {
		this.response(UNAUTHORIZED, message, extra)
		return
	}

	error(status: StatusCode, message: string, data: object = {}) {
		return { error: message, status: status ?? 500, message: message, data }

	}

	success(message: string, data: object = {}, status: StatusCode = 200, meta: IPaginationMeta = {}) {
		return { status: status, message: message, data, meta }
	}

	private response(status: StatusCode, message: string, data: object = {}) {
		return { error: message, status: status ?? 500, message: message, data }
	}
}

const ApiResponse = new ApiResponseClass()
export default ApiResponse

