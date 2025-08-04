export async function up(knex) {
	return knex.schema.createTable("wallets", (table) => {
		table.uuid("id")
			.primary()
			.defaultTo(knex.raw("(UUID())"))

		table.uuid("userId").unique().references("id").inTable("users").onDelete("CASCADE")

		table.string("email").notNullable()
		table.string("currency").nullable()
		table.integer("balance").nullable().defaultTo(0)
		table.timestamp("createdAt", { useTz: true }).defaultTo(knex.fn.now())
		table.timestamp("updatedAt", { useTz: true }).defaultTo(knex.fn.now())
	})

}

export async function down(knex) {
	return knex.schema.dropTable("wallets")
}
