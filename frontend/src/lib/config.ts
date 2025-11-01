import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet],
  connectors: [
    metaMask({
      dappMetadata: {
        url: "http://localhost:5143"
      }
    }),
  ],
  transports: {
    [mainnet.id]: http(),
  },
})