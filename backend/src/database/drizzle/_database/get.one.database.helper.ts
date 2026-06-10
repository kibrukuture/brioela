export function getOne<T>(query: { get(): T | undefined }): T | null {
	return query.get() ?? null
}
