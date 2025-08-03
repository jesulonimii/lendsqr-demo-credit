import path from "path"
import os from "os"

export const requireProcessEnv = (name: string) => {
	if (!process.env[name]) {
		throw new Error(`You must set the ${name} environment variable`)
	}
	return process.env[name]
}

export const TempFilePath = (fileName: string) => {
	return path.join(os.tmpdir(), `innbode-${fileName}`)
}
