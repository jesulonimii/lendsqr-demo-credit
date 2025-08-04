import { walletRepo } from "@routes/wallet/wallet.entity"
import { userRepo } from "@routes/user/user.entity"
import { ServiceError } from "@helpers/service-error.helper"

export const createWallet = async (userId: string) => {
	const user = await userRepo.getById(userId)
	if (!user) throw ServiceError.forbidden("User not found.")

	const wallet = await walletRepo.create({ userId, email: user?.email, balance: 0 })
	if (!wallet) throw ServiceError.forbidden("Wallet not found for this user.")
	return wallet
}

export const getBalance = async (userId: string) => {
	const user = await userRepo.getById(userId)
	if (!user) throw ServiceError.forbidden("User not found.")

	const wallet = await walletRepo.getOne({ userId })
	if (!wallet) throw ServiceError.forbidden("Wallet not found for this user.")
	return wallet
}
