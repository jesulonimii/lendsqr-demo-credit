import "dotenv/config"
import Fastify from "fastify"
import loadPlugins from "@src/plugins"
import routes from "@src/routes"
import { pinoLogger } from "@lib/pino"
import "@lib/knex"

export const app = Fastify({
	loggerInstance: pinoLogger,
	disableRequestLogging: true,
})


const start = async () => {
	try {
		await loadPlugins(app)
		app.register(routes)
		await app.ready()
		await app.listen({ port: app.config.PORT, host: "0.0.0.0" })
		return `Ready! ${app.config.PORT}`
	} catch (err) {
		app.log.error(err)
		process.exit(1)
	}
}

start().then(console.log)
