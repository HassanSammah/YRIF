import { useQuery } from 'react-query'
import { publicApi, type PublicStats } from '@/api/public'
import { ALL_NAMED_PARTNERS } from '@/data/partners'

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

/**
 * Coalition institutions published on the site, or the live registered count
 * when that directory is larger.
 */
export function partnerOrganizationCount(registered: number | undefined): number {
  return Math.max(ALL_NAMED_PARTNERS.length, registered ?? 0)
}

export function usePublicStats() {
  const query = useQuery(
    'landing:stats',
    () => publicApi.getStats().then((r) => r.data),
    { staleTime: 10 * 60_000, retry: false }
  )

  const settled = query.isSuccess || query.isError

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    format: (key: PublicStatKey) => {
      if (key === 'partner_organizations') {
        if (!settled) return formatPublicStat(undefined)
        return formatPublicStat(partnerOrganizationCount(query.data?.partner_organizations))
      }
      return formatPublicStat(query.data?.[key])
    },
  }
}
