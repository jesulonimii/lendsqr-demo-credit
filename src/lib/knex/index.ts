import knex from "knex"


export const db = knex({
	client: "mysql2",
	debug: false,
	connection: process.env.DB_URL,
	log: {
		warn: console.warn,
		error: console.error,
		debug: console.debug,
		deprecate: (message) => console.warn(`Deprecation warning: ${message}`),
	},
	pool: {
		afterCreate: (conn, done) => {
			conn.query("SET time_zone = '+00:00'", (err) => {
				if (err) {
					console.error("Error setting time zone:", err)
				}
				done(err, conn)
			})
		},
	},

})

await db.raw("SELECT 1").then(() => console.log("Connected!")).catch(console.error)


export default db
