import { useEffect } from 'react'

export function usePageTitle(page: string) {
  useEffect(() => {
    document.title = `YRIF – ${page}`
    return () => { document.title = 'YRIF – Youth Research & Innovation Foundation' }
  }, [page])
}
