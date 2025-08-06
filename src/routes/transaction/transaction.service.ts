import { userRepo } from "@routes/user/user.entity"
import { ServiceError } from "@helpers/service-error.helper"
import { transactionRepo } from "@routes/transaction/transaction.entity"
import { generatePaginationMeta } from "@src/plugins/paginate.plugin"
import { walletRepo } from "@routes/wallet/wallet.entity"
import { useDatabaseTransaction } from "@lib/knex/dbTransaction.utils"
import Generator from "@helpers/generator.helper"
import Config from "@config"


export const getTransactions = async (userId: string, filter: Record<string, any>, pagination: IPagination) => {
	const user = await userRepo.getById(userId)
	if (!user) throw ServiceError.forbidden("User not found.")
	const count = await transactionRepo.count(filter)

	const data = await transactionRepo.get(filter)

	return {
		data,
		meta: generatePaginationMeta({
			page: pagination?.page,
			limit: pagination?.limit,
			total: count,
		}),
	}

}

export const deposit = async (userId: string, { amount }: { amount: number }) => {
	return useDatabaseTransaction(async (session) => {
		const user = await userRepo.withSession(session).getById(userId)
		if (!user) throw ServiceError.forbidden("User not found.")

		const wallet = await walletRepo.withSession(session).getOne({ userId })
		if (!wallet) throw ServiceError.forbidden("Wallet not found for this user.")

		if (amount <= 0) throw ServiceError.badRequest("Deposit amount must be greater than zero.")

		wallet.balance += amount
		await walletRepo.withSession(session).updateOne({ userId }, { balance: wallet.balance })

		const reference = Generator.randomString(16, { numeric: true })
		return await transactionRepo.withSession(session).create({
			userId,
			counterpartyId: Config.ADMIN_ACCOUNT_ID,
			amount,
			type: "credit",
			currency: wallet?.currency,
			narration: `Deposited ${amount}`,
			status: "successful",
			transactionReference: reference,
			walletId: wallet.id,
			balanceBefore: wallet.balance - amount,
			balanceAfter: wallet.balance,
		})
	})
}

export const withdraw = async (userId: string, { amount }: { amount: number }) => {
	return useDatabaseTransaction(async (session) => {
		const user = await userRepo.withSession(session).getById(userId)
		if (!user) throw ServiceError.forbidden("User not found.")

		const wallet = await walletRepo.withSession(session).getOne({ userId })
		if (!wallet) throw ServiceError.forbidden("Wallet not found for this user.")

		if (amount <= 0) throw ServiceError.badRequest("Withdrawal amount must be greater than zero.")
		if (amount > wallet.balance) throw ServiceError.badRequest("Insufficient balance for withdrawal.")

		wallet.balance -= amount
		await walletRepo.withSession(session).updateOne({ userId }, { balance: wallet.balance })

		const reference = Generator.randomString(16, { numeric: true })

		return await transactionRepo.withSession(session).create({
			userId,
			amount,
			type: "debit",
			currency: wallet?.currency,
			narration: `Withdrew ${amount}`,
			status: "successful",
			transactionReference: reference,
			walletId: wallet.id,
			balanceBefore: wallet.balance + amount,
			balanceAfter: wallet.balance,
		})
	})
}

export const transfer = async (userId: string, { amount, counterpartyId }: {
	amount: number;
	counterpartyId: string
}) => {

	return await useDatabaseTransaction(async (session) => {
		const user = await userRepo.withSession(session).getById(userId)
		if (!user) throw ServiceError.forbidden("User not found.")

		const wallet = await walletRepo.withSession(session).getOne({ userId })
		if (!wallet) throw ServiceError.forbidden("Wallet not found for this user.")

		if (amount <= 0) throw ServiceError.badRequest("Transfer amount must be greater than zero.")
		if (amount > wallet.balance) throw ServiceError.badRequest("Insufficient balance for transfer.")

		const counterparty = await userRepo.withSession(session).getById(counterpartyId)
		if (!counterparty) throw ServiceError.forbidden("Counterparty not found.")

		const counterpartyWallet = await walletRepo.withSession(session).getOne({ userId: counterpartyId })
		if (!counterpartyWallet) throw ServiceError.forbidden("Counterparty wallet not found.")

		wallet.balance -= amount
		counterpartyWallet.balance += amount

		await Promise.all([
			walletRepo.updateOne({ userId }, { balance: wallet.balance }),
			walletRepo.updateOne({ userId: counterpartyId }, { balance: counterpartyWallet.balance }),
		])

		const reference = Generator.randomString(16, { numeric: true })
		const debitTransaction = transactionRepo.withSession(session).create({
			userId,
			counterpartyId: counterpartyId,
			amount,
			type: "debit",
			currency: wallet?.currency,
			narration: `Transferred ${amount} to ${counterparty.firstName}`,
			status: "successful",
			transactionReference: reference,
			walletId: wallet.id,
			balanceBefore: wallet.balance + amount,
			balanceAfter: wallet.balance,
		})

		const creditTransaction = transactionRepo.withSession(session).create({
			userId: counterpartyId,
			counterpartyId: userId,
			amount,
			type: "credit",
			currency: counterpartyWallet?.currency,
			narration: `Received ${amount} from ${user.firstName}`,
			status: "successful",
			transactionReference: reference,
			walletId: counterpartyWallet.id,
			balanceBefore: counterpartyWallet.balance - amount,
			balanceAfter: counterpartyWallet.balance,
		})

		return debitTransaction
	})

}
