interface IServiceError extends Error {
	code: StatusCode
	name: string
}

enum StatusCode {
	// 2xx Success
	OK = 200,
	Created = 201,
	Accepted = 202,
	NoContent = 204,
	PartialContent = 206,
	// 3xx Redirection
	MultipleChoices = 300,
	MovedPermanently = 301,
	Found = 302,
	BadRequest = 400,
	Unauthorized = 401,
	Forbidden = 403,
	NotFound = 404,
	Conflict = 409,
	InternalServerError = 500,
	NotImplemented = 501,
	BadGateway = 502,
	ServiceUnavailable = 503,
	GatewayTimeout = 504,
}

class ServiceError extends Error implements IServiceError {
	public code: StatusCode
	public name: string
	public cause: any

	constructor(message: string, code: StatusCode = StatusCode.InternalServerError, cause?: object) {
		super(message, { cause })
		this.name = StatusCode[code].replace(/([a-z])([A-Z])/g, '$1 $2') || "ServiceError"
		this.code = code
		this.cause = cause

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, ServiceError)
		}
	}

	// Predefined error types with corresponding status codes
	static badRequest(message: string, cause?: object): ServiceError {
		return new ServiceError(message, StatusCode.BadRequest, cause)
	}

	static unauthorized(message: string, cause?: object): ServiceError {
		return new ServiceError(message, StatusCode.Unauthorized, cause)
	}

	static forbidden(message: string, cause?: object): ServiceError {
		return new ServiceError(message, StatusCode.Forbidden, cause)
	}

	static notFound(message: string, cause?: object): ServiceError {
		return new ServiceError(message, StatusCode.NotFound, cause)
	}

	static conflict(message: string, cause?: object): ServiceError {
		return new ServiceError(message, StatusCode.Conflict, cause)
	}

	static internal(message: string = "Internal Server Error", cause?: object): ServiceError {
		return new ServiceError(message, StatusCode.InternalServerError, cause)
	}

	static notImplemented(message: string, cause?: object): ServiceError {
		return new ServiceError(message, StatusCode.NotImplemented, cause)
	}

	static badGateway(message: string, cause?: object): ServiceError {
		return new ServiceError(message, StatusCode.BadGateway, cause)
	}

	static serviceUnavailable(message: string, cause?: object): ServiceError {
		return new ServiceError(message, StatusCode.ServiceUnavailable, cause)
	}

	static gatewayTimeout(message: string, cause?: object): ServiceError {
		return new ServiceError(message, StatusCode.GatewayTimeout, cause)
	}
}

export { ServiceError, type IServiceError, StatusCode }
