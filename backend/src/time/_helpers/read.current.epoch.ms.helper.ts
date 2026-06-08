import dayjs from 'dayjs'

export function readCurrentEpochMs(): number {
	return dayjs().valueOf()
}
