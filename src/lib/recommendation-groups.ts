import type { Recommendation } from '@/lib/site-data'

/** All recommendations written by one person, in the order of `site.json`. */
export interface RecommendationGroup {
  /** Id of the first entry, stable for keys and selection */
  id: string
  name: string
  photo?: string
  headline: string
  /** Companies of every entry, joined: "DPESC · FiveLabs" */
  company: string
  entries: Recommendation[]
}

/**
 * Groups recommendations by author name (a person who recommended Conan from
 * two companies shows up once). Groups and entries keep the `site.json` order.
 */
export function groupRecommendations(
  items: Recommendation[]
): RecommendationGroup[] {
  const byName = new Map<string, Recommendation[]>()
  for (const item of items) {
    byName.set(item.name, [...(byName.get(item.name) ?? []), item])
  }
  const groups: RecommendationGroup[] = []
  for (const entries of byName.values()) {
    const [first] = entries
    if (first) {
      groups.push({
        id: first.id,
        name: first.name,
        photo: first.photo,
        headline: first.headline,
        company: entries.map((entry) => entry.company).join(' · '),
        entries,
      })
    }
  }
  return groups
}
