import type { Recommendation } from '@/lib/site-data'

/**
 * One selectable author in the recommendations section. Today each group
 * holds a single recommendation: a person who recommended from two companies
 * shows up once per company, each under its own company. `entries` stays a
 * list so the section can still render several texts for one group.
 */
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

/** One group per recommendation, in the order of `data/site/`. */
export function groupRecommendations(
  items: Recommendation[]
): RecommendationGroup[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    photo: item.photo,
    headline: item.headline,
    company: item.company,
    entries: [item],
  }))
}
