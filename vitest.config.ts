/// <reference types="vitest" />
import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
	resolve: {
		alias: {
			"@src": path.resolve(__dirname, "./src"),
			"@routes": path.resolve(__dirname, "./src/routes"),
			"@config": path.resolve(__dirname, "./src/config"),
			"@utils": path.resolve(__dirname, "./src/utils"),
			"@helpers": path.resolve(__dirname, "./src/helpers"),
			"@lib": path.resolve(__dirname, "./src/lib"),
			"__tests__": path.resolve(__dirname, "./__tests__")
		}
	},
	test: {
		globals: true,
		environment: "node",
		include: ["**/*.test.ts"],
		setupFiles: ["./vitest.setup.ts"],
		coverage: {
			reporter: ["text", "json", "html"],
			provider: "v8",
		},
	},
})
