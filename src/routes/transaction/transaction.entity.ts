import BaseRepository from "@utils/base-repository.utils"
import { Knex } from "knex"
import { db } from "@lib/knex"

declare global {
	export interface Transaction {
		id: number;
		transactionId: string
		userId: string
		walletId: number
		type: "credit" | "debit"
		amount: number
		currency: string
		balanceBefore: number
		balanceAfter: number
		status: "pending" | "successful" | "failed" | "cancelled"
		narration?: string
		category?: string
		relatedTransactionId?: number
		metadata?: Record<string, any>
		createdAt: Date
		updatedAt: Date
	}
}

class TransactionRepository extends BaseRepository<Transaction> {
	constructor(db: Knex) {
		super({ db, tableName: "transactions" })
	}
}

export const transactionRepo = new TransactionRepository(db)
