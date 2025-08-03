import { type FastifyPluginAsync } from "fastify"
import chalk from "chalk"
import fp from "fastify-plugin"

const requestLogger: FastifyPluginAsync = async (fastify) => {

	fastify.addHook("onRequest", async (request) => {
		// @ts-ignore
		request.startTime = process.hrtime()
	})

	fastify.addHook("onResponse", async (request, reply) => {
		const { method, url } = request.raw
		const statusCode = reply.statusCode

		// @ts-ignore
		const hrStart = request.startTime ?? [0, 0]
		const hrDiff = process.hrtime(hrStart)
		const responseTime = (hrDiff[0] * 1e3 + hrDiff[1] / 1e6).toFixed(3)

		let statusColor = chalk.white
		if (statusCode >= 500) statusColor = chalk.red
		else if (statusCode >= 400) statusColor = chalk.yellow
		else if (statusCode >= 300) statusColor = chalk.cyan
		else if (statusCode >= 200) statusColor = chalk.green

		const coloredStatus = statusColor(statusCode.toString())
		const coloredMethod = chalk.whiteBright(method)
		const coloredUrl = chalk.whiteBright(url)
		const coloredTime = chalk.white(`${responseTime} ms`)

		request.log.info(`${coloredMethod} ${coloredUrl} ${coloredStatus} ${coloredTime}`)
	})
}

export default fp(requestLogger, {
	name: "requestLogger",
})
