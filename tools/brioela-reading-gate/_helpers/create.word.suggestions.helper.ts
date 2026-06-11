export function createWordDistance(first: string, second: string): number {
  let distances: number[] = []
  for (let index = 0; index <= second.length; index++) distances.push(index)

  for (let index = 1; index <= first.length; index++) {
    const next: number[] = [index]
    for (let idx = 1; idx <= second.length; idx++) {
      const count = first[index - 1] === second[idx - 1] ? 0 : 1
      next.push(Math.min(
        (next[idx - 1] ?? 0) + 1,
        (distances[idx] ?? 0) + 1,
        (distances[idx - 1] ?? 0) + count,
      ))
    }
    distances = next
  }

  return distances[second.length] ?? 0
}

export function createWordSuggestions(target: string, lexicon: string[], limit = 3): string[] {
  return lexicon
    .map((word) => ({ word, distance: createWordDistance(target, word) }))
    .filter((entry) => entry.distance > 0 && entry.distance <= 2)
    .sort((first, second) => first.distance - second.distance)
    .slice(0, limit)
    .map((entry) => entry.word)
}
