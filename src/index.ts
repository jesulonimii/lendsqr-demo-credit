import Fastify from "fastify"
import loadPlugins from "@src/plugins"
import routes from "@src/routes"
import { pinoLogger } from "@lib/pino"
import { connectDatabase } from "@lib/mongoose"
import { initializeCronJobs } from "@src/cron-jobs"
import "@lib/voltagent" // Initialize VoltAgent

export const app = Fastify({
	loggerInstance: pinoLogger,
	disableRequestLogging: true,
})

const initializeApp = async () => {
	await loadPlugins(app)
	app.register(routes)
}

const start = async () => {
	try {
		await initializeApp()
		await app.ready()
		await connectDatabase(app)
		initializeCronJobs()
		await app.listen({ port: app.config.PORT, host: "0.0.0.0" })
		return `Ready! ${app.config.PORT}`
	} catch (err) {
		app.log.error(err)
		process.exit(1)
	}
}

start().then(console.log)
