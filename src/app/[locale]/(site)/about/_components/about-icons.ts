import {
  BookOpen,
  Cake,
  Dumbbell,
  Footprints,
  GraduationCap,
  Languages,
  Laptop,
  type LucideIcon,
  MapPin,
  Swords,
  TrendingUp,
  User,
} from 'lucide-react'

// Icon names used by `site.json` → `about` (day, hobbies and facts).
const ICONS: Record<string, LucideIcon> = {
  'book-open': BookOpen,
  cake: Cake,
  dumbbell: Dumbbell,
  footprints: Footprints,
  'graduation-cap': GraduationCap,
  languages: Languages,
  laptop: Laptop,
  'map-pin': MapPin,
  swords: Swords,
  'trending-up': TrendingUp,
}

export function getAboutIcon(name: string): LucideIcon {
  return ICONS[name] ?? User
}
