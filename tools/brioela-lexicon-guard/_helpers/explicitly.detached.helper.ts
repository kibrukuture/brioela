export function explicitlyDetached(promise: Promise<unknown>, reason: string): void {
  promise.catch((error: unknown) => {
    console.error(`Detached Lexicon Guard task failed: ${reason}`)
    console.error(error)
  })
}
