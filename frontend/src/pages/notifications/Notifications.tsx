import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Bell, CheckCheck, Mail, MessageSquare, Smartphone, Loader2 } from 'lucide-react'
import { SkeletonList } from '@/components/common/Skeleton'
import { communicationsApi } from '@/api/communications'
import type { NotificationItem } from '@/types/messaging'
import { usePageTitle } from '@/hooks/usePageTitle'

const CHANNEL_ICONS = {
  email: Mail,
  sms: Smartphone,
  in_app: MessageSquare,
}

const CHANNEL_COLOURS: Record<string, string> = {
  email: 'bg-purple-50 text-purple-600',
  sms: 'bg-green-50 text-green-600',
  in_app: 'bg-blue-50 text-blue-600',
}

function NotificationRow({ item }: { item: NotificationItem }) {
  const qc = useQueryClient()

  const markRead = useMutation(
    () => communicationsApi.markRead(item.id),
    { onSuccess: () => qc.invalidateQueries('notifications') },
  )

  const Icon = CHANNEL_ICONS[item.channel] ?? Bell

  return (
    <div
      className={`flex items-start gap-3 px-5 py-4 border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${
        item.is_read ? 'opacity-55' : ''
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${CHANNEL_COLOURS[item.channel] ?? 'bg-gray-50 text-gray-500'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium text-gray-900 ${!item.is_read ? 'font-semibold' : ''}`}>
            {item.subject || 'Notification'}
          </p>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {new Date(item.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.body}</p>
      </div>
      {!item.is_read && (
        <button
          onClick={() => markRead.mutate()}
          disabled={markRead.isLoading}
          className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-[#0D9488] hover:bg-teal-50 transition-colors"
          title="Mark as read"
        >
          <CheckCheck className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default function Notifications() {
  usePageTitle('Notifications')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery(
    'notifications',
    () => communicationsApi.getNotifications().then((r) => r.data),
    { refetchInterval: 30_000 },
  )

  const markAllRead = useMutation(
    () => communicationsApi.markAllRead(),
    { onSuccess: () => qc.invalidateQueries('notifications') },
  )

  const notifications: NotificationItem[] = Array.isArray(data) ? data : (data as any)?.results ?? []
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#093344] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#df8d31]" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#df8d31] text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{notifications.length} total notifications</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-[#0D9488] hover:text-[#0D9488] hover:bg-teal-50 transition-all duration-150"
          >
            {markAllRead.isLoading
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <CheckCheck className="w-3 h-3" />
            }
            Mark all read
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-5">
            <SkeletonList count={5} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Bell className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">
              You'll be notified about research updates, events, and messages here.
            </p>
          </div>
        ) : (
          notifications.map((item) => <NotificationRow key={item.id} item={item} />)
        )}
      </div>
    </div>
  )
}
