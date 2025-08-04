import { beforeEach, vi } from "vitest"

beforeEach(() => {
	// Clear all mocks before each test
	vi.clearAllMocks()

	// Reset any module mocks
	vi.resetModules()
})

declare global {
	interface IPagination {
		page?: number
		limit?: number
		skip?: number
		sort?: string
		dates?: {
			from?: string | Date
			to?: string | Date
		}
	}

	interface User {
		id: string
		firstName: string
		lastName: string
		email: string
		password: string
		salt?: string
		createdAt?: Date
		updatedAt?: Date
	}

	interface Wallet {
		id: string
		userId: string
		email?: string
		balance: number
		currency: string
	}

	interface Transaction {
		id: string
		userId: string
		counterpartyId?: string
		amount: number
		type: "credit" | "debit"
		currency: string
		narration: string
		status: string
		transactionReference: string
		walletId: string
		balanceBefore: number
		balanceAfter: number
	}
}

export {}
