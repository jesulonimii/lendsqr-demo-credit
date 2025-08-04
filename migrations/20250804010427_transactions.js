export async function up(knex) {
	return knex.schema.createTable("transactions", function(table) {
		table.uuid("id")
			.primary()
			.defaultTo(knex.raw("(UUID())"))
		table.uuid("transactionReference").notNullable() // Public transaction ID

		// User relationship (One-to-Many: User has many transactions)
		table.uuid("userId").notNullable()
		table.foreign("userId").references("id").inTable("users").onDelete("CASCADE")


		table.uuid("counterpartyId").notNullable().defaultTo("d91481ed-168f-4c31-826b-7db21f98bab6")
		table.foreign("counterpartyId").references("id").inTable("users")


		// Wallet relationship (One-to-Many: Wallet has many transactions)
		table.uuid("walletId").notNullable()
		table.foreign("walletId").references("id").inTable("wallets").onDelete("CASCADE")

		// Transaction details
		table.enum("type", ["credit", "debit"]).notNullable()
		table.decimal("amount", 15, 2).notNullable()
		table.string("currency", 3).defaultTo("NGN")
		table.decimal("balanceBefore", 15, 2).notNullable()
		table.decimal("balanceAfter", 15, 2).notNullable()

		// Transaction metadata
		table.enum("status", ["pending", "successful", "failed", "cancelled"]).defaultTo("pending")
		table.string("narration").nullable()
		table.string("category").nullable()

		table.uuid("relatedTransactionId").nullable()
		table.foreign("relatedTransactionId").references("id").inTable("transactions")

		// Metadata
		table.json("metadata").nullable() // Additional data

		table.timestamp("createdAt", { useTz: true }).defaultTo(knex.fn.now())
		table.timestamp("updatedAt", { useTz: true }).defaultTo(knex.fn.now())


	})
}

export async function down(knex) {
	return knex.schema.dropTable("transactions")
}
