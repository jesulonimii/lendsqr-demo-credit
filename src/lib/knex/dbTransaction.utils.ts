import { Knex } from "knex"
import db from "@lib/knex/index"

export async function withDatabaseTransaction<T>(
	fn: (trx: Knex.Transaction) => Promise<T>,
	options: {
		maxRetries?: number
		initialDelayMs?: number
		maxDelayMs?: number
	} = {},
): Promise<T> {
	const { maxRetries = 0, initialDelayMs = 0, maxDelayMs = 10000 } = options

	let retryCount = 0
	let lastError = null

	while (retryCount <= maxRetries) {
		// Apply delay with exponential backoff (except first attempt)
		if (retryCount > 0) {
			const delayMs = Math.min(initialDelayMs * Math.pow(2, retryCount - 1), maxDelayMs)
			console.log(`Retry attempt ${retryCount}/${maxRetries}, waiting ${delayMs}ms`)
			await new Promise(resolve => setTimeout(resolve, delayMs))
		}

		const trx = await db.transaction()

		try {
			// Execute the provided function with the transaction
			const result = await fn(trx)

			await trx.commit()
			console.log("Database Transaction successful")
			return result
		} catch (error) {
			await trx.rollback()

			// Check if error is retryable
			const isRetryable = isRetryableError(error)

			if (isRetryable && retryCount < maxRetries) {
				console.log(`Database Transaction failed with retryable error: ${error.message}`)
				lastError = error
				retryCount++
			} else {
				// Either non-retryable error or exceeded max retries
				console.error(`Database Transaction failed permanently: ${error.message}`)
				throw error
			}
		}
	}

	// If we've exhausted all retries
	throw lastError || new Error("All Database transaction retries failed")
}

function isRetryableError(error: any): boolean {
	// Common SQL error codes that can be retried
	const retryableErrorCodes = [
		// MySQL error codes
		1205, // Lock wait timeout exceeded
		1213, // Deadlock found when trying to get lock
		1689, // Wait on a lock was aborted due to a pending exclusive lock
		2013, // Lost connection to MySQL server during query
		2006, // MySQL server has gone away
		1040, // Too many connections
		1226, // User has exceeded the 'max_user_connections' resource

		// PostgreSQL error codes (SQLSTATE)
		"40001", // Serialization failure
		"40P01", // Deadlock detected
		"53300", // Too many connections
		"08006", // Connection failure
		"08000", // Connection exception
		"08003", // Connection does not exist
		"08007", // Connection failure during transaction
		"57P01", // Admin shutdown
		"57P02", // Crash shutdown
		"57P03", // Cannot connect now

		// SQLite error codes
		5, // SQLITE_BUSY - database is locked
		6, // SQLITE_LOCKED - database table is locked
		10, // SQLITE_IOERR - disk I/O error
		14, // SQLITE_CANTOPEN - unable to open database file
	]

	// Check numeric error codes (MySQL, SQLite)
	if (error.code && retryableErrorCodes.includes(error.code)) {
		return true
	}

	// Check string error codes (PostgreSQL SQLSTATE)
	if (error.code && typeof error.code === "string" && retryableErrorCodes.includes(error.code)) {
		return true
	}

	// Check errno for system-level errors
	if (error.errno && retryableErrorCodes.includes(error.errno)) {
		return true
	}

	// Check error messages for patterns indicating transient issues
	const retryablePatterns = [
		// Connection issues
		/connection.*closed/i,
		/connection.*lost/i,
		/connection.*timeout/i,
		/connection.*refused/i,
		/connection.*reset/i,
		/server.*gone away/i,
		/too many connections/i,

		// Lock and deadlock issues
		/deadlock/i,
		/lock.*timeout/i,
		/lock.*wait.*timeout/i,
		/database.*locked/i,
		/table.*locked/i,

		// Timeout issues
		/timeout/i,
		/timed out/i,

		// Serialization issues
		/serialization.*failure/i,
		/could not serialize/i,

		// Resource issues
		/out of memory/i,
		/disk.*full/i,
		/no space left/i,

		// Network issues
		/network.*error/i,
		/socket.*error/i,
		/transport.*error/i,
	]

	if (error.message && retryablePatterns.some(pattern => pattern.test(error.message))) {
		return true
	}

	// Check for specific database client errors
	if (error.name) {
		const retryableErrorNames = [
			"ConnectionError",
			"TimeoutError",
			"NetworkError",
			"SocketError",
			"DatabaseError",
		]

		if (retryableErrorNames.some(name => error.name.includes(name))) {
			return true
		}
	}

	return false
}

export const useDatabaseTransaction = withDatabaseTransaction
