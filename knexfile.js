export default {
	development: {
		client: "mysql2",
		connection: "mysql://root:root@localhost:3306/lendsqr-demo-credit",
		seeds: {
			directory: "./seeds"
		}
	},
	production: {
		client: "mysql2",
		connection: process.env.DB_URL,
		seeds: {
			directory: "./seeds"
		}
	}
}
