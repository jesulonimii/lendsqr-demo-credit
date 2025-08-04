export const requireEnv = (name: string) => {
	if (!process.env[name]) {
		throw new Error(`You must set the ${name} environment variable`)
	}
	return process.env[name]
}


