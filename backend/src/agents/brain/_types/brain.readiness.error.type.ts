export class BrainReadinessUnavailableError extends Error {
	constructor() {
		super('Brioela Brain migrations have not reported readiness.')
		this.name = 'BrainReadinessUnavailableError'
	}
}
