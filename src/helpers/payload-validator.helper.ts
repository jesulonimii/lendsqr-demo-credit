import * as z from "zod-v4"
import { ZodObject, type ZodTypeAny } from "zod-v4"
import { ServiceError } from "@helpers/service-error.helper"

interface ISchema {
	[key: string]: ZodTypeAny
}

/**
 * Validates the payload against the provided schema.
 *
 * @param {Object} options - The validation parameters.
 * @param {object} options.payload - Payload to validate.
 * @param {(zodLib: typeof z) => ZodObject<S>} options.schema - Function that returns the Zod schema.
 * @param {boolean} [options.allowUnknown=false] - Whether to allow unknown fields in the payload.
 *
 * @returns {Object} - An object containing error status, message, and the payload if valid.
 * @throws {ServiceError.badRequest} If the payload is invalid.
 */
const ValidatePayload = <S extends ISchema>(options: {
	payload: object | any
	schema: (zodLib: (typeof z)["z"]) => S
	allowUnknown?: boolean
}): { error: boolean; payload: z.infer<ZodObject<S>>; message: string } => {
	const { payload, schema: schemaBuilder, allowUnknown } = options
	// Pass the zod library to the schema builder function
	let schema = schemaBuilder(z) // Build schema using the provided function
	let zodSchema = z.object(schema)

	if (allowUnknown) {
		zodSchema = zodSchema.loose()
	}

	try {
		const parsed: z.infer<typeof zodSchema> = zodSchema.parse(payload)
		return {
			error: false,
			payload: parsed,
			message: "Payload is valid",
		}
	} catch (err) {
		if (err instanceof z.ZodError) {
			// Using the first issue's message for the error
			const firstIssue = err.issues[0]
			const message = firstIssue ? generateMessage(firstIssue) : "Validation failed"
			throw ServiceError.badRequest(message, err.issues)
		}

		throw ServiceError.internal("An unexpected error occurred during validation", err)
	}
}

/**
 * Generate a user-friendly error message from a Zod issue
 */
function generateMessage(issue: z.core.$ZodIssue): string {
	const path = issue.path.join(".")
	const pathPrefix = path ? `${path}: ` : ""

	switch (issue.code) {
		case "invalid_type":
			return `${pathPrefix}Expected ${issue.expected}, received ${issue.input}`

		case "too_small":
			return `${pathPrefix}Must be ${issue.inclusive ? ">=" : ">"} ${issue.minimum}`

		case "too_big":
			return `${pathPrefix}Must be ${issue.inclusive ? "<=" : "<"} ${issue.maximum}`

		case "unrecognized_keys":
			return `Unrecognized keys: ${issue.keys.join(", ")}`

		case "invalid_format":
			return `${pathPrefix}Invalid format: ${issue.message}`

		case "not_multiple_of":
			return `${pathPrefix}Must be a multiple of ${issue.divisor}`

		case "invalid_union":
			return `${pathPrefix}Invalid input`

		case "invalid_value":
			return `${pathPrefix}Must be one of: ${issue.values.join(", ")}`

		case "custom":
			return `${pathPrefix}${issue.message}`

		default:
			return issue.message
	}
}

export default ValidatePayload
