export async function up(knex) {
	return knex.schema.createTable("users", (table) => {
		table.uuid("id")
			.primary()
			.defaultTo(knex.raw("(UUID())"))
		table.string("email").notNullable().unique()
		table.string("password").notNullable()
		table.string("firstName").nullable()
		table.string("lastName").nullable()
		table.string("phoneNumber").nullable()
		table.string("salt").nullable()
		table.timestamp("createdAt", { useTz: true }).defaultTo(knex.fn.now())
		table.timestamp("updatedAt", { useTz: true }).defaultTo(knex.fn.now())
	})

}

export async function down(knex) {
	return knex.schema.dropTable("users")
}
