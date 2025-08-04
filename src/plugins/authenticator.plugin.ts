import fp from "fastify-plugin"
import fastifyJwt from "@fastify/jwt"
import { FastifyPluginAsync } from "fastify"
import fastifyCookie from "@fastify/cookie"


declare module "fastify" {
	interface FastifyInstance {
		authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
	}
}


declare module "@fastify/jwt" {
	interface FastifyJWT {
		payload: { id: string; email?: string } // for sign()
		user: { id: string; email?: string }    // for request.user
	}
}


const authPlugin: FastifyPluginAsync = async (fastify) => {
	fastify.register(fastifyCookie, { secret: fastify.config.JWT_SECRET })

	// Register fastify-jwt
	fastify.register(fastifyJwt, {
		secret: fastify.config.JWT_SECRET,
		cookie: {
			cookieName: "accessToken",
			signed: false, // Set to true if you want to sign the cookie
		},
	})

	// Decorate authenticate hook
	fastify.decorate("authenticate", async (request, reply) => {
		try {
			await request.jwtVerify()
		} catch (err) {
			reply.code(401).send({
				status: 401,
				message: "Unauthorized access: Invalid or missing token",
				error: err.message || "Unauthorized",
			})
		}
	})
}

export default fp(authPlugin, {
	name: "authenticator",
	fastify: ">4.x",
})
