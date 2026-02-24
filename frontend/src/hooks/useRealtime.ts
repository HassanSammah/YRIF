import { useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? '',
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
)

export function useRealtimeChannel(channelName: string, onMessage: (payload: unknown) => void) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL) return

    channelRef.current = supabase
      .channel(channelName)
      .on('broadcast', { event: 'message' }, ({ payload }) => onMessage(payload))
      .subscribe()

    return () => {
      channelRef.current?.unsubscribe()
    }
  }, [channelName, onMessage])

  const sendMessage = (payload: unknown) => {
    channelRef.current?.send({ type: 'broadcast', event: 'message', payload })
  }

  return { sendMessage }
}
