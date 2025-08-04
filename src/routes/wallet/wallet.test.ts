import { beforeEach, describe, expect, it, Mock, vi } from "vitest"
import { createWallet, getBalance } from "./wallet.service"
import { walletRepo } from "@routes/wallet/wallet.entity"
import { userRepo } from "@routes/user/user.entity"
import { ServiceError } from "@helpers/service-error.helper"

vi.mock("@lib/knex", () => (
	{ db: {} }
))
vi.mock("@routes/wallet/wallet.entity")
vi.mock("@routes/user/user.entity")
vi.mock("@helpers/service-error.helper")

describe("Wallet Service", () => {
	const mockUser = {
		id: "user-123",
		firstName: "John",
		lastName: "Doe",
		email: "john@test.com",
	}

	const mockWallet = {
		id: "wallet-123",
		userId: "user-123",
		email: "john@test.com",
		balance: 1000,
		currency: "NGN",
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("createWallet", () => {
		it("should create wallet successfully for valid user", async () => {
			(userRepo.getById as Mock).mockResolvedValue(mockUser)
			;(walletRepo.create as Mock).mockResolvedValue(mockWallet)

			const result = await createWallet("user-123")

			expect(userRepo.getById).toHaveBeenCalledWith("user-123")
			expect(walletRepo.create).toHaveBeenCalledWith({
				userId: "user-123",
				email: "john@test.com",
				balance: 0,
			})
			expect(result).toEqual(mockWallet)
		})

		it("should throw error if user not found", async () => {
			(userRepo.getById as Mock).mockResolvedValue(null)
			;(ServiceError.forbidden as Mock).mockImplementation((msg) => new Error(msg))

			await expect(createWallet("invalid-user-id"))
				.rejects.toThrow("User not found.")

			expect(userRepo.getById).toHaveBeenCalledWith("invalid-user-id")
			expect(walletRepo.create).not.toHaveBeenCalled()
		})

		it("should throw error if wallet creation fails", async () => {
			(userRepo.getById as Mock).mockResolvedValue(mockUser)
			;(walletRepo.create as Mock).mockResolvedValue(null)
			;(ServiceError.forbidden as Mock).mockImplementation((msg) => new Error(msg))

			await expect(createWallet("user-123"))
				.rejects.toThrow("Wallet not found for this user.")

			expect(userRepo.getById).toHaveBeenCalledWith("user-123")
			expect(walletRepo.create).toHaveBeenCalledWith({
				userId: "user-123",
				email: "john@test.com",
				balance: 0,
			})
		})

		it("should handle user with undefined email", async () => {
			const userWithoutEmail = { ...mockUser, email: undefined }
			;(userRepo.getById as Mock).mockResolvedValue(userWithoutEmail)
			;(walletRepo.create as Mock).mockResolvedValue(mockWallet)

			const result = await createWallet("user-123")

			expect(walletRepo.create).toHaveBeenCalledWith({
				userId: "user-123",
				email: undefined,
				balance: 0,
			})
			expect(result).toEqual(mockWallet)
		})
	})

	describe("getBalance", () => {
		it("should get wallet balance successfully for valid user", async () => {
			(userRepo.getById as Mock).mockResolvedValue(mockUser)
			;(walletRepo.getOne as Mock).mockResolvedValue(mockWallet)

			const result = await getBalance("user-123")

			expect(userRepo.getById).toHaveBeenCalledWith("user-123")
			expect(walletRepo.getOne).toHaveBeenCalledWith({ userId: "user-123" })
			expect(result).toEqual(mockWallet)
		})

		it("should throw error if user not found", async () => {
			(userRepo.getById as Mock).mockResolvedValue(null)
			;(ServiceError.forbidden as Mock).mockImplementation((msg) => new Error(msg))

			await expect(getBalance("invalid-user-id"))
				.rejects.toThrow("User not found.")

			expect(userRepo.getById).toHaveBeenCalledWith("invalid-user-id")
			expect(walletRepo.getOne).not.toHaveBeenCalled()
		})

		it("should throw error if wallet not found for user", async () => {
			(userRepo.getById as Mock).mockResolvedValue(mockUser)
			;(walletRepo.getOne as Mock).mockResolvedValue(null)
			;(ServiceError.forbidden as Mock).mockImplementation((msg) => new Error(msg))

			await expect(getBalance("user-123"))
				.rejects.toThrow("Wallet not found for this user.")

			expect(userRepo.getById).toHaveBeenCalledWith("user-123")
			expect(walletRepo.getOne).toHaveBeenCalledWith({ userId: "user-123" })
		})

		it("should handle database errors gracefully", async () => {
			const dbError = new Error("Database connection failed")
			;(userRepo.getById as Mock).mockRejectedValue(dbError)

			await expect(getBalance("user-123"))
				.rejects.toThrow("Database connection failed")

			expect(userRepo.getById).toHaveBeenCalledWith("user-123")
		})

		it("should return wallet with zero balance", async () => {
			const emptyWallet = { ...mockWallet, balance: 0 }
			;(userRepo.getById as Mock).mockResolvedValue(mockUser)
			;(walletRepo.getOne as Mock).mockResolvedValue(emptyWallet)

			const result = await getBalance("user-123")

			expect(result.balance).toBe(0)
			expect(result).toEqual(emptyWallet)
		})

		it("should return wallet with negative balance", async () => {
			const overdraftWallet = { ...mockWallet, balance: -500 }
			;(userRepo.getById as Mock).mockResolvedValue(mockUser)
			;(walletRepo.getOne as Mock).mockResolvedValue(overdraftWallet)

			const result = await getBalance("user-123")

			expect(result.balance).toBe(-500)
			expect(result).toEqual(overdraftWallet)
		})
	})
})
