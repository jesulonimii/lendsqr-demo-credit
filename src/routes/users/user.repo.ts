import BaseRepository from "@utils/base-repository.utils"
import { Knex } from "knex"
import { db } from "@lib/knex"

declare global {
	interface User {
		id: number
		firstName: string
		lastName: string
		email: string
		password: string
		createdAt: Date
		updatedAt: Date
	}
}

class UserRepository extends BaseRepository<User> {
	constructor(db: Knex) {
		super({ db, tableName: "users" })
	}
}

export const userRepository = new UserRepository(db)
