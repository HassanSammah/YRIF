import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from 'react-query'
import { router } from './routes'
import ChatWidget from '@/components/chatbot/ChatWidget'
import { queryClient } from '@/lib/queryClient'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ChatWidget />
    </QueryClientProvider>
  )
}
