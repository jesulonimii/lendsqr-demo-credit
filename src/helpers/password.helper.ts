import argon2 from "argon2"

/**
 * Encrypts a password using Argon2.
 * @param password - The password to hash.
 * @param options - Optional Argon2 hashing options.
 * @returns The hashed password.
 */
const encrypt = async (password: string, options?: argon2.Options) => {
	return await argon2.hash(password, {
		type: argon2.argon2id, // Use Argon2id for better security
		...options, // Allow custom options (e.g., timeCost, memoryCost)
	})
}

/**
 * Compares a password with a given hash.
 * @param hash - The hash to compare against.
 * @param password - The password to verify.
 * @returns True if the password matches the hash, otherwise false.
 */
const compare = async (hash: string, password: string) => {
	return await argon2.verify(hash, password)
}

const PasswordHelper = {
	encrypt,
	compare,
}

export default PasswordHelper
