import BaseRepository from "@utils/base-repository.utils"
import { Knex } from "knex"
import { db } from "@lib/knex"

declare global {
	interface Transaction {
		id: string
		amount: number
		currency: string
		userId: string
		type: "credit" | "debit"
		status: "pending" | "successful" | "failed"
		narration: string
	}
}

class TransactionRepository extends BaseRepository<Transaction> {
	constructor(db: Knex) {
		super({ db, tableName: "transactions" })
	}
}

export const transactionRepo = new TransactionRepository(db)
