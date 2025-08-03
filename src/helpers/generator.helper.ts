import { customAlphabet as nanoCustomAlphabet } from "nanoid"

function generateSlug(
	value: string,
	options: {
		uppercase: boolean
		separator: string
	} = { uppercase: false, separator: "-" }
) {
	const slugValue = value.trim().replace(/\s+/g, options?.separator)
	return options?.uppercase ? slugValue?.toUpperCase() : slugValue?.toLowerCase()
}

function generateId(length: number, options?: { upperCase?: boolean; prefix?: string; numeric?: boolean }) {
	let alphabet = options?.numeric ? "0123456789" : options?.upperCase ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" : "abcdefghijklmnopqrstuvwxyz0123456789"
	const nanoid = nanoCustomAlphabet(alphabet, length)
	const id = nanoid()
	return (options?.prefix ?? "") + id
}

function destructureName(name: string) {
	const name_parts = name.split(" ")
	if (!name || !name_parts.length) {
		return {
			first_name: null,
			middle_name: null,
			last_name: null,
		}
	}

	console.log(name_parts)

	if (name_parts.length === 1) {
		return {
			first_name: name_parts[0]?.replace(",", "") || null, // Assign first part as first_name or null if undefined
			middle_name: null,
			last_name: null,
		}
	}

	if (name_parts.length === 2) {
		return {
			first_name: name_parts[0]?.replace(",", "") || null, // Assign first part as first_name or null if undefined
			middle_name: null,
			last_name: name_parts[1]?.replace(",", "") || null, // Assign second part as last_name or null if undefined
		}
	} else if (name_parts.length === 3) {
		return {
			first_name: name_parts[0]?.replace(",", "") || null, // Assign first part as first_name or null if undefined
			middle_name: name_parts[1]?.replace(",", "") || null,
			last_name: name_parts[2]?.replace(",", "") || null, // Assign second part as last_name or null if undefined
		}
	} else {
		return {
			first_name: name_parts[0].replace(",", "") || null, // Assign first part as first_name or null if undefined
			middle_name: name_parts[1].replace(",", "") || null, // Assign second part as middle_name or null if undefined
			last_name: name_parts.slice(2).join(" ").replace(",", "") || null, // Combine remaining parts as last_name or null if undefined
		}
	}
}

const Generator = {
	slug: generateSlug,
	randomString: generateId,
	destructureName,
}

export default Generator
