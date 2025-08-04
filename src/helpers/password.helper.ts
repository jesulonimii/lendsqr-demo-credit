import argon2 from "argon2"
import { nanoid } from "nanoid"

const encrypt = async (password: string, options?: argon2.Options) => {
	return await argon2.hash(password, {
		type: argon2.argon2id, // Use Argon2id for better security
		...options, // Allow custom options (e.g., timeCost, memoryCost)
	})
}


const compare = async (hash: string, password: string, options?: argon2.Options) => {
	return await argon2.verify(hash, password)
}


const generateSalt = async (length: number = 16) => {
	return nanoid(length)
}

const PasswordHelper = {
	encrypt,
	compare,
	generateSalt,
}

export default PasswordHelper
