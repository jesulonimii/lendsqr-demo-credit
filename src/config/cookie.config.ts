import { type SerializeOptions } from "@fastify/cookie"

export const COOKIE_CONFIG: SerializeOptions = {
	//maxAge: COOKIE_AGE,
	httpOnly: true,
	//secure: env !== "development",
}
