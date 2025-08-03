import pino from "pino"

export const pinoLogger = pino({
	transport: {
		target: "pino-pretty",
		options: {
			colorize: true,
			levelFirst: true,
			translateTime: "hh:MM:ss, Z",
			ignore: "pid,hostname",
		},
	},
})
