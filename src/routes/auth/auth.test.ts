import { beforeEach, describe, expect, it, Mock, vi } from "vitest"
import { createUser, loginUser } from "./auth.service"
import { userRepo } from "@routes/user/user.entity"
import { ServiceError } from "@helpers/service-error.helper"
import PasswordHelper from "@helpers/password.helper"
import * as walletService from "@routes/wallet/wallet.service"
import { adjutorApi } from "@lib/lendsqr/adjutor"

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
vi.mock("@helpers/service-error.helper")
vi.mock("@helpers/password.helper")
vi.mock("@routes/wallet/wallet.service")
vi.mock("@lib/lendsqr/adjutor")

vi.spyOn(console, "error").mockImplementation(() => {
})
vi.spyOn(console, "log").mockImplementation(() => {
})

describe("Auth Service", () => {
	const mockUserData = {
		email: "john@test.com",
		password: "password123",
		firstName: "John",
		lastName: "Doe",
	}

	const mockCreatedUser = {
		id: "user-123",
		email: "john@test.com",
		firstName: "John",
		lastName: "Doe",
		password: "hashedPassword",
		salt: "mockSalt",
	}

	const mockUserWithWallet = {
		...mockCreatedUser,
		wallet: {
			id: "wallet-123",
			userId: "user-123",
			balance: 0,
			currency: "NGN",
		},
	}

	const mockSalt = "mockSaltValue"
	const mockHashedPassword = "hashedPassword123"

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe("createUser", () => {
		beforeEach(() => {
			(PasswordHelper.generateSalt as Mock).mockResolvedValue(mockSalt)
			;(PasswordHelper.encrypt as Mock).mockResolvedValue(mockHashedPassword)
			;(walletService.createWallet as Mock).mockResolvedValue(true)
		})

		it("should create user successfully without karma check", async () => {
			(userRepo.getOne as Mock).mockRejectedValue(new Error("User not found"))
			;(userRepo.create as Mock).mockResolvedValue(mockCreatedUser)
			;(userRepo.getById as Mock).mockResolvedValue(mockUserWithWallet)

			const result = await createUser(mockUserData)

			expect(userRepo.getOne).toHaveBeenCalledWith({ email: "john@test.com" })
			expect(PasswordHelper.generateSalt).toHaveBeenCalled()
			expect(PasswordHelper.encrypt).toHaveBeenCalledWith("password123", {
				salt: Buffer.from(mockSalt),
			})
			expect(userRepo.create).toHaveBeenCalledWith(expect.objectContaining({
				email: "john@test.com",
				firstName: "John",
				lastName: "Doe",
				password: mockHashedPassword,
				salt: mockSalt,
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date),
			}))
			expect(walletService.createWallet).toHaveBeenCalledWith("user-123")
			expect(result).toEqual(mockUserWithWallet)
		})

		it("should throw error if user already exists", async () => {
			(userRepo.getOne as Mock).mockResolvedValue(mockCreatedUser)
			;(ServiceError.conflict as Mock).mockImplementation((msg) => new Error(msg))

			await expect(createUser(mockUserData))
				.rejects.toThrow("User already exists.")

			expect(userRepo.getOne).toHaveBeenCalledWith({ email: "john@test.com" })
			expect(userRepo.create).not.toHaveBeenCalled()
		})

		it("should perform karma check for suspicious email", async () => {
			const scamUserData = { ...mockUserData, email: "scammer@scam.com" }
			const mockKarmaResponse = {
					status: "success",
					data: { karma_identity: null },
				}

			;(userRepo.getOne as Mock).mockRejectedValue(new Error("User not found"))
			;(adjutorApi.checkKarma as Mock).mockResolvedValue(mockKarmaResponse)
			;(userRepo.create as Mock).mockResolvedValue(mockCreatedUser)
			;(userRepo.getById as Mock).mockResolvedValue(mockUserWithWallet)

			const result = await createUser(scamUserData)

			expect(adjutorApi.checkKarma).toHaveBeenCalledWith("scammer@scam.com")
			expect(userRepo.create).toHaveBeenCalled()
			expect(result).toEqual(mockUserWithWallet)
		})

		it("should throw error if karma check fails", async () => {
			const scamUserData = { ...mockUserData, email: "scammer@scam.com" }
			const mockKarmaResponse = {
					status: "error",
					message: "API error",
				}

			;(userRepo.getOne as Mock).mockRejectedValue(new Error("User not found"))
			;(adjutorApi.checkKarma as Mock).mockResolvedValue(mockKarmaResponse)
			;(ServiceError.internal as Mock).mockImplementation((msg) => new Error(msg))

			await expect(createUser(scamUserData))
				.rejects.toThrow("Karma check failed: API error")

			expect(adjutorApi.checkKarma).toHaveBeenCalledWith("scammer@scam.com")
			expect(userRepo.create).not.toHaveBeenCalled()
		})

		it("should throw error if user is blacklisted", async () => {
			const scamUserData = { ...mockUserData, email: "scammer@scam.com" }
			const mockKarmaResponse = {
					status: "success",
					data: { karma_identity: "blacklisted" },
				}

			;(userRepo.getOne as Mock).mockRejectedValue(new Error("User not found"))
			;(adjutorApi.checkKarma as Mock).mockResolvedValue(mockKarmaResponse)
			;(ServiceError.forbidden as Mock).mockImplementation((msg) => new Error(msg))

			await expect(createUser(scamUserData))
				.rejects.toThrow("User is blacklisted due to karma issues.")

			expect(adjutorApi.checkKarma).toHaveBeenCalledWith("scammer@scam.com")
			expect(userRepo.create).not.toHaveBeenCalled()
		})

		it("should throw error if user creation fails", async () => {
			(userRepo.getOne as Mock).mockRejectedValue(new Error("User not found"))
			;(userRepo.create as Mock).mockResolvedValue(null)
			;(ServiceError.internal as Mock).mockImplementation((msg) => new Error(msg))

			await expect(createUser(mockUserData))
				.rejects.toThrow("Failed to create user.")

			expect(userRepo.create).toHaveBeenCalled()
		})

		it("should handle wallet creation failure gracefully", async () => {
			(userRepo.getOne as Mock).mockRejectedValue(new Error("User not found"))
			;(userRepo.create as Mock).mockResolvedValue(mockCreatedUser)
			;(userRepo.getById as Mock).mockResolvedValue(mockUserWithWallet)
			;(walletService.createWallet as Mock).mockRejectedValue(new Error("Wallet creation failed"))

			const result = await createUser(mockUserData)

			expect(walletService.createWallet).toHaveBeenCalledWith("user-123")
			expect(result).toEqual(mockUserWithWallet)
		})

	})

	describe("loginUser", () => {
		const loginData = {
			email: "john@test.com",
			password: "password123",
		}

		const mockStoredUser = {
			id: "user-123",
			email: "john@test.com",
			password: "hashedPassword123",
			firstName: "John",
			lastName: "Doe",
		}

		it("should login user successfully with valid credentials", async () => {
			(userRepo.getOne as Mock).mockResolvedValue(mockStoredUser)
			;(PasswordHelper.compare as Mock).mockResolvedValue(true)
			;(userRepo.getById as Mock).mockResolvedValue(mockUserWithWallet)

			const result = await loginUser(loginData)

			expect(userRepo.getOne).toHaveBeenCalledWith({ email: "john@test.com" })
			expect(PasswordHelper.compare).toHaveBeenCalledWith({
				hash: "hashedPassword123",
				password: "password123",
			})
			expect(userRepo.getById).toHaveBeenCalledWith("user-123", [{
				foreignKey: "userId",
				table: "wallets",
				as: "wallet",
				justOne: true,
			}])
			expect(result).toEqual(mockUserWithWallet)
		})

		it("should throw error if user not found", async () => {
			(userRepo.getOne as Mock).mockResolvedValue(null)
			;(ServiceError.forbidden as Mock).mockImplementation((msg) => new Error(msg))

			await expect(loginUser(loginData))
				.rejects.toThrow("Invalid login credentials.")

			expect(userRepo.getOne).toHaveBeenCalledWith({ email: "john@test.com" })
			expect(PasswordHelper.compare).not.toHaveBeenCalled()
		})

		it("should throw error if password is invalid", async () => {
			(userRepo.getOne as Mock).mockResolvedValue(mockStoredUser)
			;(PasswordHelper.compare as Mock).mockResolvedValue(false)
			;(ServiceError.forbidden as Mock).mockImplementation((msg) => new Error(msg))

			await expect(loginUser(loginData))
				.rejects.toThrow("Invalid login credentials.")

			expect(userRepo.getOne).toHaveBeenCalledWith({ email: "john@test.com" })
			expect(PasswordHelper.compare).toHaveBeenCalledWith({
				hash: "hashedPassword123",
				password: "password123",
			})
			expect(userRepo.getById).not.toHaveBeenCalled()
		})

		it("should handle empty email", async () => {
			const emptyEmailData = { ...loginData, email: "" }
			;(userRepo.getOne as Mock).mockResolvedValue(null)
			;(ServiceError.forbidden as Mock).mockImplementation((msg) => new Error(msg))

			await expect(loginUser(emptyEmailData))
				.rejects.toThrow("Invalid login credentials.")

			expect(userRepo.getOne).toHaveBeenCalledWith({ email: "" })
		})

		it("should handle empty password", async () => {
			const emptyPasswordData = { ...loginData, password: "" }
			;(userRepo.getOne as Mock).mockResolvedValue(mockStoredUser)
			;(PasswordHelper.compare as Mock).mockResolvedValue(false)
			;(ServiceError.forbidden as Mock).mockImplementation((msg) => new Error(msg))

			await expect(loginUser(emptyPasswordData))
				.rejects.toThrow("Invalid login credentials.")

			expect(PasswordHelper.compare).toHaveBeenCalledWith({
				hash: "hashedPassword123",
				password: "",
			})
		})

		it("should handle database errors during user lookup", async () => {
			const dbError = new Error("Database connection failed")
			;(userRepo.getOne as Mock).mockRejectedValue(dbError)

			await expect(loginUser(loginData))
				.rejects.toThrow("Database connection failed")

			expect(userRepo.getOne).toHaveBeenCalledWith({ email: "john@test.com" })
		})

		it("should handle password comparison errors", async () => {
			const passwordError = new Error("Password comparison failed")
			;(userRepo.getOne as Mock).mockResolvedValue(mockStoredUser)
			;(PasswordHelper.compare as Mock).mockRejectedValue(passwordError)

			await expect(loginUser(loginData))
				.rejects.toThrow("Password comparison failed")

			expect(PasswordHelper.compare).toHaveBeenCalledWith({
				hash: "hashedPassword123",
				password: "password123",
			})
		})

		it("should handle user retrieval with wallet failure", async () => {
			const retrievalError = new Error("Failed to retrieve user with wallet")
			;(userRepo.getOne as Mock).mockResolvedValue(mockStoredUser)
			;(PasswordHelper.compare as Mock).mockResolvedValue(true)
			;(userRepo.getById as Mock).mockRejectedValue(retrievalError)

			await expect(loginUser(loginData))
				.rejects.toThrow("Failed to retrieve user with wallet")

			expect(userRepo.getById).toHaveBeenCalledWith("user-123", [{
				foreignKey: "userId",
				table: "wallets",
				as: "wallet",
				justOne: true,
			}])
		})

		it("should log user information on successful login", async () => {
			const consoleSpy = vi.spyOn(console, "log")

			;(userRepo.getOne as Mock).mockResolvedValue(mockStoredUser)
			;(PasswordHelper.compare as Mock).mockResolvedValue(true)
			;(userRepo.getById as Mock).mockResolvedValue(mockUserWithWallet)

			await loginUser(loginData)

			expect(consoleSpy).toHaveBeenCalledWith(mockStoredUser)
		})
	})
})
