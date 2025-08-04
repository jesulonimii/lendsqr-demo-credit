import { userRepo } from "@routes/user/user.entity"
import { ServiceError } from "@helpers/service-error.helper"
import { transactionRepo } from "@routes/transaction/transaction.entity"
import { generatePaginationMeta } from "@src/plugins/paginate.plugin"
import { walletRepo } from "@routes/wallet/wallet.entity"
import { useDatabaseTransaction } from "@lib/knex/dbTransaction.utils"


export const getTransactions = async (userId: string, filter: Record<string, any>, pagination: IPagination) => {
	const user = await userRepo.getById(userId)
	if (!user) throw ServiceError.forbidden("User not found.")

	const count = await transactionRepo.count(filter)

	const data = await transactionRepo.buildQuery(filter)
		.limit(pagination?.limit)
		.skip(pagination?.skip)
		.fromDate(pagination?.dates?.from, "createdAt")
		.toDate(pagination?.dates?.to, "createdAt")
		.sort(pagination?.sort)

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
	const user = await userRepo.getById(userId)
	if (!user) throw ServiceError.forbidden("User not found.")

	const wallet = await walletRepo.getOne({ userId })
	if (!wallet) throw ServiceError.forbidden("Wallet not found for this user.")

	if (amount <= 0) throw ServiceError.badRequest("Deposit amount must be greater than zero.")

	wallet.balance += amount
	await walletRepo.updateOne({ userId }, { balance: wallet.balance })

	return wallet
}

export const withdraw = async (userId: string, { amount }: { amount: number }) => {
	const user = await userRepo.getById(userId)
	if (!user) throw ServiceError.forbidden("User not found.")

	const wallet = await walletRepo.getOne({ userId })
	if (!wallet) throw ServiceError.forbidden("Wallet not found for this user.")

	if (amount <= 0) throw ServiceError.badRequest("Withdrawal amount must be greater than zero.")
	if (amount > wallet.balance) throw ServiceError.badRequest("Insufficient balance for withdrawal.")

	wallet.balance -= amount
	await walletRepo.updateOne({ userId }, { balance: wallet.balance })

	return wallet
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

		const debitTransaction = transactionRepo.withSession(session).create({
			userId,
			amount,
			type: "debit",
			currency: wallet?.currency,
			narration: `Transferred ${amount} to ${counterparty.firstName}`,
			status: "successful",
		})

		const creditTransaction = transactionRepo.withSession(session).create({
			userId: counterpartyId,
			amount,
			type: "credit",
			currency: counterpartyWallet?.currency,
			narration: `Received ${amount} from ${user.firstName}`,
			status: "successful",
		})

		return debitTransaction
	})

}
