import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	schema: './src/agents/brain/_schema/index.ts',
	out: './src/agents/brain/drizzle',
	dialect: 'sqlite',
	driver: 'durable-sqlite',
})
