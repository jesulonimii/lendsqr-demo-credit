import { Knex } from "knex"

export type UpdateData<T> = Partial<T>
export type Filter<T> = Partial<T> & Record<string, any>
export type Select<T> = (keyof T)[] | string[]

export interface PopulateOption {
	table: string
	foreignKey: string
	as: string
	localKey?: string
}

export type Populate<T> = PopulateOption[]

interface QueryBuilderStart<T> {
	buildQuery(filter: Filter<T>): QueryBuilderBuilt<T>
}

interface QueryBuilderBuilt<T> {
	skip(skip: number): this

	limit(limit: number): this

	sort(sort: "asc" | "desc", column?: string): this

	populate(populate: Populate<T>): this

	select(select: Select<T>): this

	fromDate(date: Date, column?: string): this

	toDate(date: Date, column?: string): this

	then(resolve: (value: T[]) => void, reject?: (reason: any) => void): Promise<void>

	catch(reject: (reason: any) => void): Promise<any>
}

export type DatabaseTransaction = Knex.Transaction

class QueryBuilder<T> implements QueryBuilderStart<T>, QueryBuilderBuilt<T> {
	protected db: Knex
	protected tableName: string
	protected query: Knex.QueryBuilder
	protected transaction?: DatabaseTransaction

	constructor(db: Knex, tableName: string, transaction?: DatabaseTransaction) {
		this.db = db
		this.tableName = tableName
		this.transaction = transaction
	}

	buildQuery(filter: Filter<T>): QueryBuilderBuilt<T> {
		this.query = this.transaction ? this.transaction(this.tableName) : this.db(this.tableName)

		if (filter && Object.keys(filter).length > 0) {
			this.query = this.query.where(filter)
		}

		return this
	}

	skip(skip: number): this {
		this.query = this.query.offset(skip)
		return this
	}

	limit(limit: number): this {
		this.query = this.query.limit(limit)
		return this
	}

	sort(sort: "asc" | "desc", column: string = "created_at"): this {
		this.query = this.query.orderBy(column, sort)
		return this
	}

	populate(populate: Populate<T>): this {
		if (populate && populate.length) {
			populate.forEach(({ table, foreignKey, as, localKey = "id" }) => {
				this.query = this.query.leftJoin(table, `${this.tableName}.${localKey}`, `${table}.${foreignKey}`)
					.select(`${this.tableName}.*`, `${table}.*`)
			})
		}
		return this
	}

	select(select: Select<T>): this {
		if (select && select.length) {
			const columns = select.map(col => `${this.tableName}.${String(col)}`)
			this.query = this.query.select(columns)
		}
		return this
	}

	fromDate(date: Date, column: string = "created_at"): this {
		if (!this.query) {
			throw new Error("Query has not been built. Call buildQuery first.")
		}
		if (date) {
			this.query = this.query.where(column, ">=", date)
		}
		return this
	}

	toDate(date: Date, column: string = "created_at"): this {
		if (!this.query) {
			throw new Error("Query has not been built. Call buildQuery first.")
		}
		if (date) {
			this.query = this.query.where(column, "<=", date)
		}
		return this
	}

	then(resolve: (value: T[]) => void, reject?: (reason: any) => void): Promise<void> {
		return this.exec().then(resolve, reject)
	}

	catch(reject: (reason: any) => void) {
		return this.exec().catch(reject)
	}

	private async exec(): Promise<T[]> {
		return this.query
	}
}

export default class BaseRepository<T = any> {
	protected db: Knex
	protected tableName: string
	private queryBuilder: QueryBuilderStart<T>
	private transaction?: DatabaseTransaction

	constructor({ db, tableName, transaction }: { db: Knex; tableName: string; transaction?: DatabaseTransaction }) {
		this.db = db
		this.tableName = tableName
		this.transaction = transaction
		this.queryBuilder = new QueryBuilder<T>(db, tableName, transaction)
	}

	withTransaction(transaction: DatabaseTransaction): BaseRepository<T> {
		return new BaseRepository<T>({ db: this.db, tableName: this.tableName, transaction })
	}

	async create(data: Partial<T>): Promise<T> {
		try {
			const query = this.transaction ? this.transaction(this.tableName) : this.db(this.tableName)
			const [result] = await query.insert(data).returning("*")
			return result
		} catch (error) {
			throw new Error(`Error creating ${this.tableName}: ${error.message}`)
		}
	}

	async getById(id: string | number, populate?: Populate<T>, select?: Select<T>): Promise<T | null> {
		try {
			let query = this.transaction ? this.transaction(this.tableName) : this.db(this.tableName)
			query = query.where("id", id)

			if (populate && populate.length) {
				populate.forEach(({ table, foreignKey, as, localKey = "id" }) => {
					query = query.leftJoin(table, `${this.tableName}.${localKey}`, `${table}.${foreignKey}`)
				})
			}

			if (select && select.length) {
				const columns = select.map(col => `${this.tableName}.${String(col)}`)
				query = query.select(columns)
			} else {
				query = query.select(`${this.tableName}.*`)
			}

			return await query.first()
		} catch (error) {
			throw new Error(`Error getting ${this.tableName} by ID: ${error.message}`)
		}
	}

	async getOne(filter: Filter<T>, populate?: Populate<T>, select?: Select<T>): Promise<T | null> {
		try {
			let query = this.transaction ? this.transaction(this.tableName) : this.db(this.tableName)

			if (filter && Object.keys(filter).length > 0) {
				query = query.where(filter)
			}

			if (populate && populate.length) {
				populate.forEach(({ table, foreignKey, as, localKey = "id" }) => {
					query = query.leftJoin(table, `${this.tableName}.${localKey}`, `${table}.${foreignKey}`)
				})
			}

			if (select && select.length) {
				const columns = select.map(col => `${this.tableName}.${String(col)}`)
				query = query.select(columns)
			} else {
				query = query.select(`${this.tableName}.*`)
			}

			return await query.first()
		} catch (error) {
			throw new Error(`Error getting ${this.tableName} by query: ${error.message}`)
		}
	}

	async get(
		filter: Filter<T>,
		populate?: Populate<T>,
		select?: Select<T>,
		{
			skip = 0,
			limit = 200,
			sort = "desc",
			sortColumn = "created_at",
		}: {
			skip?: number
			limit?: number
			sort?: "asc" | "desc"
			sortColumn?: string
		} = {},
	): Promise<T[]> {
		try {
			let query = this.transaction ? this.transaction(this.tableName) : this.db(this.tableName)

			if (filter && Object.keys(filter).length > 0) {
				query = query.where(filter)
			}

			query = query.offset(skip).limit(limit).orderBy(sortColumn, sort)

			if (populate && populate.length) {
				populate.forEach(({ table, foreignKey, as, localKey = "id" }) => {
					query = query.leftJoin(table, `${this.tableName}.${localKey}`, `${table}.${foreignKey}`)
				})
			}

			if (select && select.length) {
				const columns = select.map(col => `${this.tableName}.${String(col)}`)
				query = query.select(columns)
			} else {
				query = query.select(`${this.tableName}.*`)
			}

			return await query
		} catch (error) {
			throw new Error(`Error getting ${this.tableName} by query: ${error.message}`)
		}
	}

	async updateById(id: string | number, data: UpdateData<T>): Promise<T | null> {
		try {
			const query = this.transaction ? this.transaction(this.tableName) : this.db(this.tableName)
			const [result] = await query.where("id", id).update(data).returning("*")
			return result || null
		} catch (error) {
			throw new Error(`Error updating ${this.tableName} by ID: ${error.message}`)
		}
	}

	async updateOne(filter: Filter<T>, data: UpdateData<T>): Promise<T | null> {
		try {
			let query = this.transaction ? this.transaction(this.tableName) : this.db(this.tableName)

			if (filter && Object.keys(filter).length > 0) {
				query = query.where(filter)
			}

			const [result] = await query.update(data).returning("*")
			return result || null
		} catch (error) {
			throw new Error(`Error updating ${this.tableName} by query: ${error.message}`)
		}
	}

	async deleteById(id: string | number): Promise<T | null> {
		try {
			const query = this.transaction ? this.transaction(this.tableName) : this.db(this.tableName)
			const [result] = await query.where("id", id).del().returning("*")
			return result || null
		} catch (error) {
			throw new Error(`Error deleting ${this.tableName} by ID: ${error.message}`)
		}
	}

	async deleteOne(filter: Filter<T>): Promise<T | null> {
		try {
			let query = this.transaction ? this.transaction(this.tableName) : this.db(this.tableName)

			if (filter && Object.keys(filter).length > 0) {
				query = query.where(filter)
			}

			const [result] = await query.del().returning("*")
			return result || null
		} catch (error) {
			throw new Error(`Error deleting ${this.tableName} by query: ${error.message}`)
		}
	}

	async count(filter: Filter<T>): Promise<number> {
		try {
			let query = this.transaction ? this.transaction(this.tableName) : this.db(this.tableName)

			if (filter && Object.keys(filter).length > 0) {
				query = query.where(filter)
			}

			const [{ count }] = await query.count("* as count")
			return parseInt(count as string, 10)
		} catch (error) {
			throw new Error(`Error counting ${this.tableName}: ${error.message}`)
		}
	}

	async exists(filter: Filter<T>): Promise<boolean> {
		try {
			const count = await this.count(filter)
			return count > 0
		} catch (error) {
			throw new Error(`Error checking if ${this.tableName} exists: ${error.message}`)
		}
	}

	async aggregate(pipeline: any[]): Promise<any[]> {
		// Note: Knex doesn't have MongoDB-style aggregation pipelines
		// This would need to be implemented with raw SQL or specific Knex queries
		// depending on your aggregation needs
		throw new Error("Aggregate method needs to be implemented based on specific SQL aggregation requirements")
	}

	async bulkCreate(data: Partial<T>[]): Promise<T[]> {
		try {
			const query = this.transaction ? this.transaction(this.tableName) : this.db(this.tableName)
			return await query.insert(data).returning("*")
		} catch (error) {
			throw new Error(`Error bulk creating ${this.tableName}: ${error.message}`)
		}
	}

	async bulkUpdate(filter: Filter<T>, data: Partial<T>): Promise<number> {
		try {
			let query = this.transaction ? this.transaction(this.tableName) : this.db(this.tableName)

			if (filter && Object.keys(filter).length > 0) {
				query = query.where(filter)
			}

			return await query.update(data)
		} catch (error) {
			throw new Error(`Error bulk updating ${this.tableName}: ${error.message}`)
		}
	}

	async bulkDelete(filter: Filter<T>): Promise<number> {
		try {
			let query = this.transaction ? this.transaction(this.tableName) : this.db(this.tableName)

			if (filter && Object.keys(filter).length > 0) {
				query = query.where(filter)
			}

			return await query.del()
		} catch (error) {
			throw new Error(`Error bulk deleting ${this.tableName}: ${error.message}`)
		}
	}

	async bulkUpsert(filter: Filter<T>, data: Partial<T>): Promise<T[]> {
		try {
			const query = this.transaction ? this.transaction(this.tableName) : this.db(this.tableName)

			// Use onConflict for upsert functionality
			return await query.insert({ ...filter, ...data })
				.onConflict(Object.keys(filter))
				.merge(data)
				.returning("*")
		} catch (error) {
			throw new Error(`Error bulk upserting ${this.tableName}: ${error.message}`)
		}
	}

	buildQuery(filter: Filter<T>): QueryBuilderBuilt<T> {
		return this.queryBuilder.buildQuery(filter)
	}


}
