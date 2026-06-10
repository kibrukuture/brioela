export function getReturned<T>(query: { get(): T }): T {
	return query.get()
}
