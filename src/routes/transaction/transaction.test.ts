import { beforeEach, describe, expect, it, Mock, vi } from "vitest"
import { deposit, getTransactions, transfer, withdraw } from "./transaction.service"
import { userRepo } from "@routes/user/user.entity"
import { transactionRepo } from "@routes/transaction/transaction.entity"
import { walletRepo } from "@routes/wallet/wallet.entity"
import { ServiceError } from "@helpers/service-error.helper"
import { useDatabaseTransaction } from "@lib/knex/dbTransaction.utils"
import Generator from "@helpers/generator.helper"

vi.mock("@lib/knex", () => (
	{ db: {} }
))
vi.mock("@config", () => ({
	default: {
		ENV: "development",
		LENDSQR_API_KEY: "123",
	}
}))
vi.mock("@routes/user/user.entity")
vi.mock("@routes/transaction/transaction.entity")
vi.mock("@routes/wallet/wallet.entity")
vi.mock("@helpers/service-error.helper")
vi.mock("@lib/knex/dbTransaction.utils")
vi.mock("@helpers/generator.helper")
vi.mock("@src/plugins/paginate.plugin", () => ({
	generatePaginationMeta: vi.fn(() => ({ page: 1, limit: 10, total: 5 })),
}))

describe("Transaction Service", () => {
	const mockUser = { id: "user-123", firstName: "John", email: "john@test.com" }
	const mockWallet = { id: "wallet-123", userId: "user-123", balance: 1000, currency: "NGN" }
	const mockTransaction = { id: "tx-123", userId: "user-123", amount: 100 }
	const mockSession = { id: "session-123" }


	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("getTransactions", () => {
		const mockFilter = { userId: "user-123" }
		const mockPagination = { page: 1, limit: 10, skip: 0 }

		it("should return transactions successfully", async () => {
			(userRepo.getById as Mock).mockResolvedValue(mockUser)

			const result = await getTransactions("user-123", mockFilter, mockPagination)

			expect(result).toHaveProperty("data")
			expect(result).toHaveProperty("meta")
		})

		it("should throw error if user not found", async () => {
			(userRepo.getById as Mock).mockResolvedValue(null)
			;(ServiceError.forbidden as Mock).mockImplementation((msg) => new Error(msg))

			await expect(getTransactions("user-123", mockFilter, mockPagination))
				.rejects.toThrow("User not found.")
		})
	})

	describe("deposit", () => {


		beforeEach(() => {
			(useDatabaseTransaction as Mock).mockImplementation(async (callback) => {
				return callback(mockSession)
			})
			;(Generator.randomString as Mock).mockReturnValue("1234567890123456")
		})

		it("should deposit successfully", async () => {
			const mockUserRepo = {
				getById: vi.fn().mockResolvedValue(mockUser),
			}
			const mockWalletRepo = {
				getOne: vi.fn().mockResolvedValue(mockWallet),
				updateOne: vi.fn().mockResolvedValue(true),
			}
			const mockTransactionRepo = {
					create: vi.fn().mockResolvedValue(mockTransaction),
				}

			;(userRepo.withSession as Mock).mockReturnValue(mockUserRepo)
			;(walletRepo.withSession as Mock).mockReturnValue(mockWalletRepo)
			;(transactionRepo.withSession as Mock).mockReturnValue(mockTransactionRepo)

			const result = await deposit("user-123", { amount: 500 })

			expect(mockUserRepo.getById).toHaveBeenCalledWith("user-123")
			expect(mockWalletRepo.getOne).toHaveBeenCalledWith({ userId: "user-123" })
			expect(mockWalletRepo.updateOne).toHaveBeenCalledWith(
				{ userId: "user-123" },
				{ balance: 1500 },
			)
			expect(mockTransactionRepo.create).toHaveBeenCalledWith({
				userId: "user-123",
				amount: 500,
				type: "credit",
				currency: "NGN",
				narration: "Deposited 500",
				status: "successful",
				transactionReference: "1234567890123456",
				walletId: "wallet-123",
				balanceBefore: 1000,
				balanceAfter: 1500,
			})
			expect(result).toEqual(mockTransaction)
		})

		it("should throw error if user not found", async () => {
			const mockUserRepo = {
					getById: vi.fn().mockResolvedValue(null),
				}
			;(userRepo.withSession as Mock).mockReturnValue(mockUserRepo)
			;(ServiceError.forbidden as Mock).mockImplementation((msg) => new Error(msg))

			await expect(deposit("user-123", { amount: 500 }))
				.rejects.toThrow("User not found.")
		})

		it("should throw error if wallet not found", async () => {
			const mockUserRepo = {
				getById: vi.fn().mockResolvedValue(mockUser),
			}
			const mockWalletRepo = {
					getOne: vi.fn().mockResolvedValue(null),
				}

			;(userRepo.withSession as Mock).mockReturnValue(mockUserRepo)
			;(walletRepo.withSession as Mock).mockReturnValue(mockWalletRepo)
			;(ServiceError.forbidden as Mock).mockImplementation((msg) => new Error(msg))

			await expect(deposit("user-123", { amount: 500 }))
				.rejects.toThrow("Wallet not found for this user.")
		})

		it("should throw error for invalid deposit amount", async () => {
			const mockUserRepo = {
				getById: vi.fn().mockResolvedValue(mockUser),
			}
			const mockWalletRepo = {
					getOne: vi.fn().mockResolvedValue(mockWallet),
				}

			;(userRepo.withSession as Mock).mockReturnValue(mockUserRepo)
			;(walletRepo.withSession as Mock).mockReturnValue(mockWalletRepo)
			;(ServiceError.badRequest as Mock).mockImplementation((msg) => new Error(msg))

			await expect(deposit("user-123", { amount: 0 }))
				.rejects.toThrow("Deposit amount must be greater than zero.")

			await expect(deposit("user-123", { amount: -100 }))
				.rejects.toThrow("Deposit amount must be greater than zero.")
		})
	})

	describe("withdraw", () => {


		beforeEach(() => {
			(useDatabaseTransaction as Mock).mockImplementation(async (callback) => {
				return callback(mockSession)
			})
			;(Generator.randomString as Mock).mockReturnValue("1234567890123456")
		})

		it("should withdraw successfully", async () => {
			const mockUserRepo = {
				getById: vi.fn().mockResolvedValue(mockUser),
			}
			const mockWalletRepo = {
				getOne: vi.fn().mockResolvedValue(mockWallet),
				updateOne: vi.fn().mockResolvedValue(true),
			}
			const mockTransactionRepo = {
					create: vi.fn().mockResolvedValue(mockTransaction),
				}

			;(userRepo.withSession as Mock).mockReturnValue(mockUserRepo)
			;(walletRepo.withSession as Mock).mockReturnValue(mockWalletRepo)
			;(transactionRepo.withSession as Mock).mockReturnValue(mockTransactionRepo)

			const result = await withdraw("user-123", { amount: 300 })

			expect(result).toHaveProperty("id")
		})

		it("should throw error for insufficient balance", async () => {
			const mockUserRepo = {
				getById: vi.fn().mockResolvedValue(mockUser),
			}
			const mockWalletRepo = {
					getOne: vi.fn().mockResolvedValue(mockWallet),
				}

			;(userRepo.withSession as Mock).mockReturnValue(mockUserRepo)
			;(walletRepo.withSession as Mock).mockReturnValue(mockWalletRepo)
			;(ServiceError.badRequest as Mock).mockImplementation((msg) => new Error(msg))

			await expect(withdraw("user-123", { amount: 1500 }))
				.rejects.toThrow("Insufficient balance for withdrawal.")
		})

		it("should throw error for invalid withdrawal amount", async () => {
			const mockUserRepo = {
				getById: vi.fn().mockResolvedValue(mockUser),
			}
			const mockWalletRepo = {
					getOne: vi.fn().mockResolvedValue(mockWallet),
				}

			;(userRepo.withSession as Mock).mockReturnValue(mockUserRepo)
			;(walletRepo.withSession as Mock).mockReturnValue(mockWalletRepo)
			;(ServiceError.badRequest as Mock).mockImplementation((msg) => new Error(msg))

			await expect(withdraw("user-123", { amount: 0 }))
				.rejects.toThrow("Withdrawal amount must be greater than zero.")
		})
	})

	describe("transfer", () => {
		const mockUser = { id: "user-123", firstName: "John", email: "john@test.com" }
		const mockWallet = { id: "wallet-123", userId: "user-123", balance: 1000, currency: "NGN" }
		const mockTransaction = { id: "tx-123", userId: "user-123", amount: 100 }
		const mockSession = { id: "session-123" }


		const mockCounterparty = { id: "user-456", firstName: "Jane", email: "jane@test.com" }
		const mockCounterpartyWallet = { id: "wallet-456", userId: "user-456", balance: 500, currency: "NGN" }

		beforeEach(() => {
			(useDatabaseTransaction as Mock).mockImplementation(async (callback) => {
				return callback(mockSession)
			})
			;(Generator.randomString as Mock).mockReturnValue("1234567890123456")
		})

		it("should transfer successfully", async () => {
			const mockUserRepo = {
				getById: vi.fn()
					.mockResolvedValueOnce(mockUser)
					.mockResolvedValueOnce(mockCounterparty),
			}
			const mockWalletRepo = {
				getOne: vi.fn()
					.mockResolvedValueOnce(mockWallet)
					.mockResolvedValueOnce(mockCounterpartyWallet),
				updateOne: vi.fn().mockResolvedValue(true),
			}
			const mockTransactionRepo = {
					create: vi.fn()
						.mockResolvedValueOnce(mockTransaction)
						.mockResolvedValueOnce({ ...mockTransaction, id: "tx-456" }),
				}

			;(userRepo.withSession as Mock).mockReturnValue(mockUserRepo)
			;(walletRepo.withSession as Mock).mockReturnValue(mockWalletRepo)
			;(transactionRepo.withSession as Mock).mockReturnValue(mockTransactionRepo)

			const result = await transfer("user-123", { amount: 200, counterpartyId: "user-456" })

			expect(mockUserRepo.getById).toHaveBeenCalledWith("user-123")
			expect(mockUserRepo.getById).toHaveBeenCalledWith("user-456")
			expect(mockWalletRepo.getOne).toHaveBeenCalledWith({ userId: "user-123" })
			expect(mockWalletRepo.getOne).toHaveBeenCalledWith({ userId: "user-456" })
			expect(result).toEqual(mockTransaction)
		})

		it("should throw error if counterparty not found", async () => {
			const mockUserRepo = {
				getById: vi.fn()
					.mockResolvedValueOnce(mockUser)
					.mockResolvedValueOnce(null),
			}
			const mockWalletRepo = {
					getOne: vi.fn().mockResolvedValueOnce(mockWallet),
				}

			;(userRepo.withSession as Mock).mockReturnValue(mockUserRepo)
			;(walletRepo.withSession as Mock).mockReturnValue(mockWalletRepo)
			;(ServiceError.forbidden as Mock).mockImplementation((msg) => new Error(msg))

			await expect(transfer("user-123", { amount: 200, counterpartyId: "user-456" }))
				.rejects.toThrow("Counterparty not found.")
		})

		it("should throw error if counterparty wallet not found", async () => {
			const mockUserRepo = {
				getById: vi.fn()
					.mockResolvedValueOnce(mockUser)
					.mockResolvedValueOnce(mockCounterparty),
			}
			const mockWalletRepo = {
					getOne: vi.fn()
						.mockResolvedValueOnce(mockWallet)
						.mockResolvedValueOnce(null),
				}

			;(userRepo.withSession as Mock).mockReturnValue(mockUserRepo)
			;(walletRepo.withSession as Mock).mockReturnValue(mockWalletRepo)
			;(ServiceError.forbidden as Mock).mockImplementation((msg) => new Error(msg))

			await expect(transfer("user-123", { amount: 200, counterpartyId: "user-456" }))
				.rejects.toThrow("Counterparty wallet not found.")
		})

		it("should throw error for insufficient balance", async () => {
			const mockUserRepo = {
				getById: vi.fn()
					.mockResolvedValueOnce(mockUser)
					.mockResolvedValueOnce(mockCounterparty),
			}
			const mockWalletRepo = {
					getOne: vi.fn()
						.mockResolvedValueOnce(mockWallet)
						.mockResolvedValueOnce(mockCounterpartyWallet),
				}

			;(userRepo.withSession as Mock).mockReturnValue(mockUserRepo)
			;(walletRepo.withSession as Mock).mockReturnValue(mockWalletRepo)
			;(ServiceError.badRequest as Mock).mockImplementation((msg) => new Error(msg))

			await expect(transfer("user-123", { amount: 1500, counterpartyId: "user-456" }))
				.rejects.toThrow("Insufficient balance for transfer.")
		})
	})
})
