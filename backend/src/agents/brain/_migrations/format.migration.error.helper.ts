export function formatMigrationError(error: unknown): string {
	if (error instanceof Error) {
		return JSON.stringify({
			name: error.name,
			message: error.message,
		})
	}

	return JSON.stringify({
		name: 'UnknownBrainMigrationError',
		message: 'Brain migration failed with a non-Error thrown value.',
	})
}
