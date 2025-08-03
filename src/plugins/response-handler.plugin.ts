import fp from "fastify-plugin"
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify"

const responseHandler: FastifyPluginAsync<{}> = async fastify => {
	// Add hook that runs right before the response is sent
	fastify.addHook("onSend", async (request: FastifyRequest, reply: FastifyReply, payload: any) => {
		// Only parse JSON responses, skip HTML and other content types
		const contentType = reply.getHeader('content-type')
		if (contentType && typeof contentType === 'string' && contentType.includes('application/json')) {
			try {
				const parsedPayload = JSON.parse(payload)
				const statusCode = Number(parsedPayload.status || 200)
				reply.code(statusCode)
			} catch (error) {
				// If JSON parsing fails, just return the payload as is
				console.warn("Failed to parse JSON payload:", error)
			}
		}
		
		return payload
	})

	fastify.setErrorHandler((error, request, reply) => {
		const statusCode = Number(error.code || 500)
		reply.code(statusCode).send({
			status: statusCode,
			message: error.message,
			error: error.name,
			cause: error?.cause || {}
		})
	})
}

export default fp(responseHandler, {
	name: "responseHandler",
	fastify: ">4.x",
})
