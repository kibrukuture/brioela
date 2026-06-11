import { join } from 'node:path'

export const gateStateFolder = '/var/brioela-gate'

export const gateSocketPath = join(gateStateFolder, 'gate.sock')
export const gatePidPath = join(gateStateFolder, 'gate.pid')

export const gateLogFolder = join(gateStateFolder, 'logs')
export const gateRunLogPath = join(gateLogFolder, 'gate.out.log')
export const gateErrorLogPath = join(gateLogFolder, 'gate.err.log')
export const gateEventsLogPath = join(gateLogFolder, 'gate.events.log')

export const manifestFolder = join(gateStateFolder, 'manifest')
export const manifestPath = join(manifestFolder, 'manifest.tsv')

export const readTtlMs = 240 * 60 * 1000
