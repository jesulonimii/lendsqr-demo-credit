import BaseRepository from "@utils/base-repository.utils"
import { Knex } from "knex"
import { db } from "@lib/knex"

declare global {
	interface Wallet {
		id: number
		userId: string
		email: string
		balance: number
		currency: string
		createdAt: Date
		updatedAt: Date
	}
}

class WalletRepository extends BaseRepository<Wallet> {
	constructor(db: Knex) {
		super({ db, tableName: "Wallets" })
	}
}

export const walletRepo = new WalletRepository(db)
