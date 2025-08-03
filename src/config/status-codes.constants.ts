export const OK = 200
export const CREATED = 201
export const BAD_REQUEST = 400
export const UNAUTHORIZED = 401
export const NOT_FOUND = 404
export const INTERNAL_SERVER_ERROR = 500
export const CONFLICT = 409
export const FORBIDDEN = 403
export const UNPROCESSABLE_ENTITY = 422
export const TOO_MANY_REQUESTS = 429
export const SERVICE_UNAVAILABLE = 503
export const GATEWAY_TIMEOUT = 504
export const NOT_IMPLEMENTED = 501
export const BAD_GATEWAY = 502
export const REQUEST_TIMEOUT = 408
export const PAYMENT_REQUIRED = 402


const CODES = {
    OK,
    CREATED,
    BAD_REQUEST,
    UNAUTHORIZED,
    NOT_FOUND,
    INTERNAL_SERVER_ERROR,
    CONFLICT,
    FORBIDDEN,
    UNPROCESSABLE_ENTITY,
    TOO_MANY_REQUESTS,
    SERVICE_UNAVAILABLE,
    GATEWAY_TIMEOUT,
    NOT_IMPLEMENTED,
    BAD_GATEWAY,
    REQUEST_TIMEOUT,
    PAYMENT_REQUIRED,
}

export type IStatusCode = typeof CODES[keyof typeof CODES]


export default CODES
