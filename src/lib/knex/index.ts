import knex from "knex"


export const db = knex({
	client: "mysql",
	connection: {
		uri: process.env.MYSQL_DATABASE_URL,
	},
	log: {
		warn: (message) => {
		},
		error: (message) => {
		},
		deprecate: (message) => {
		},
		debug: (message) => {
		},
	},
})

