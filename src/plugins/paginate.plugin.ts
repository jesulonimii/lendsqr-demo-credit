import { type FastifyPluginAsync, type FastifyReply, type FastifyRequest } from "fastify"
import fp from "fastify-plugin"
import moment from "moment"

// Extend FastifyRequest interface to include pagination
declare module "fastify" {
	interface FastifyRequest {
		pagination: {
			page: number
			limit: number
			skip: number
			sort: "asc" | "desc"
			dates: {
				from?: Date
				to?: Date
			}
		}
	}
}

declare global {
	interface IPaginationMeta {
		total?: number
		page?: number
		pages?: number
		limit?: number
	}
}

export const generatePaginationMeta = (option: { total: number, page: number, limit: number }): IPaginationMeta => {
	const { total, page, limit } = option
	return {
		total,
		page,
		pages: Math.ceil(total / limit),
		limit,
	}
}

const paginationPlugin: FastifyPluginAsync<{
	maxLimit?: number
}> = async (fastify, options) => {
	const maxLimit = options.maxLimit || 100

	fastify.decorateRequest("pagination", null)

	fastify.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
		const {
			page: getPage,
			limit: getLimit,
			from: getFromDate,
			to: getToDate,
			sort,
			...rest
		} = request.query as {
			page?: string
			limit?: string
			from?: string
			to?: string
			sort?: string
			[key: string]: any
		}

		const page = parseInt(getPage as string) || 1
		const limit = parseInt(getLimit as string) || 10
		const skip = (page - 1) * limit

		// Format date with moment
		const from = getFromDate ? moment(getFromDate).startOf("day").toDate() : undefined
		const to = getToDate ? moment(getToDate).endOf("day").toDate() : undefined

		if (sort && sort !== "asc" && sort !== "desc") {
			reply.code(400).send({
				status: "error",
				message: "Sort must be either asc or desc",
			})
			return reply
		}

		if (isNaN(page) || isNaN(limit)) {
			reply.code(400).send({
				status: "error",
				message: "Invalid page or limit",
			})
			return reply
		}

		if (limit > maxLimit) {
			reply.code(400).send({
				status: "error",
				message: `Limit cannot exceed ${maxLimit}`,
			})
			return reply
		}

		request.pagination = {
			page,
			limit,
			skip,
			sort: (sort?.toLowerCase() as "asc" | "desc") || "desc",
			dates: {
				from,
				to,
			},
		}

		// Clean up query params
		const formattedQuery = Object.keys(rest).reduce((newObj, key) => {
			if (rest[key] !== undefined && rest[key] !== "undefined" && rest[key] !== null && rest[key] !== "null") {
				newObj[key] = rest[key]
			}
			return newObj
		}, {} as Record<string, any>)

		// Replace the original query with the cleaned one
		request.query = formattedQuery
	})

	// Add utility function for generating pagination metadata
	fastify.decorate("generatePaginationMeta", generatePaginationMeta)
}


export default fp(paginationPlugin, {
	name: "pagination",
	fastify: ">4.x",
})
