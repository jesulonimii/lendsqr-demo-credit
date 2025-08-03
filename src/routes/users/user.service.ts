import { userRepository } from "@routes/users/user.repo"
import { ServiceError } from "@helpers/service-error.helper"

export async function createUser(userData: Partial<User>): Promise<any> {
	const existingUser = await userRepository.getOne({ email: userData?.email })
	if (existingUser) throw ServiceError.conflict("User already exists.")

	const user = await userRepository.create(userData)

	if (!user) throw ServiceError.internal("Failed to create user.")
	return user
}

