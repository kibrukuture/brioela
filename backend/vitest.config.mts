import { cloudflareTest } from '@cloudflare/vitest-pool-workers'
import agents from 'agents/vite'
import { defineConfig } from 'vitest/config'

const sourceRoot = new URL('./src', import.meta.url).pathname
const sharedRoot = new URL('../shared', import.meta.url).pathname

export default defineConfig({
	plugins: [
		...agents(),
		cloudflareTest({
			main: './src/agents/brain/brain.test.worker.ts',
			wrangler: { configPath: './wrangler.jsonc' },
		}),
	],
	test: {
		include: ['src/**/*.test.ts'],
	},
	resolve: {
		alias: {
			'@': sourceRoot,
			'@brioela/shared': sharedRoot,
		},
	},
})
