import { Toaster } from '@/components/ui/sonner'
import { config } from '@/lib/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import SidepanelApp from './app'

const queryClient = new QueryClient()

export default function AppProviders() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <SidepanelApp />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
