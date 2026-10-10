import { useQuery } from 'react-query'
import { publicApi, type PublicStats } from '@/api/public'

export type PublicStatKey = keyof PublicStats

export const PUBLIC_STAT_LABELS: { key: PublicStatKey; label: string }[] = [
  { key: 'total_members', label: 'Youth Members' },
  { key: 'research_projects', label: 'Research Projects' },
  { key: 'events_hosted', label: 'Events Hosted' },
  { key: 'partner_organizations', label: 'Partner Organizations' },
]

/** Exact live count, or an em dash while loading / on error. */
export function formatPublicStat(value: number | undefined): string {
  if (value === undefined) return '—'
  return value.toLocaleString('en-US')
}

export function usePublicStats() {
  const query = useQuery(
    'landing:stats',
    () => publicApi.getStats().then((r) => r.data),
    { staleTime: 10 * 60_000, retry: false }
  )

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    format: (key: PublicStatKey) => formatPublicStat(query.data?.[key]),
  }
}
