export function createContentHash(fileBytes: ArrayBuffer): string {
  return Bun.SHA256.hash(fileBytes, 'hex')
}
