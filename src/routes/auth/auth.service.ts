import { userRepo } from "@routes/user/user.entity"
import { ServiceError } from "@helpers/service-error.helper"
import PasswordHelper from "@helpers/password.helper"
import * as walletService from "@routes/wallet/wallet.service"

export async function createUser(userData: Partial<User>): Promise<any> {
	const existingUser = await userRepo.getOne({ email: userData?.email }).catch(console.error)
	if (existingUser) throw ServiceError.conflict("User already exists.")

	const salt = await PasswordHelper.generateSalt()
	const password = await PasswordHelper.encrypt(userData?.password, {
		salt: Buffer.from(salt),
	})

	Object.assign(userData, {
		password,
		salt,
		createdAt: new Date(),
		updatedAt: new Date(),
	})

	const createdUser = await userRepo.create(userData)
	if (!createdUser) throw ServiceError.internal("Failed to create user.")

	await walletService.createWallet(createdUser.id).catch(() => {
	})

	return await userRepo.getById(createdUser.id, [{
		foreignKey: "userId",
		table: "wallets",
		as: "wallet",
		justOne: true,
	}])
}

export async function loginUser({ email, password }: { email: string, password: string }) {
	const user = await userRepo.getOne({ email })
	if (!user) throw ServiceError.forbidden("Invalid login credentials.")

	const isPasswordValid = await PasswordHelper.compare({
		hash: user.password,
		password,
	})

	if (!isPasswordValid) throw ServiceError.forbidden("Invalid login credentials.")

	console.log(user)
	return await userRepo.getById(user.id, [{
		foreignKey: "userId",
		table: "wallets",
		as: "wallet",
		justOne: true,
	}])

}
