import "./App.css"
import "@rainbow-me/rainbowkit/styles.css"
import "./variables.css"

import { WagmiConfig, createClient, configureChains, mainnet } from "wagmi"
import { publicProvider } from "wagmi/providers/public"
import { darkTheme, getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { LandingPage } from "./pages/LandingPage"
import * as allChains from "@wagmi/chains"
import deployments from "./deployments.json"

// Loop over all chains and check if they match deployments.chainId
const deployedChain = Object.values(allChains).filter((chain) => {
  return deployments.chainId === chain.id.toString()
})[0]

console.log(deployedChain)

// Check if in development
const isDev = process.env.NODE_ENV === "development"

const { chains, provider, webSocketProvider } = configureChains([deployedChain], [publicProvider()])

const { connectors } = getDefaultWallets({
  appName: "Solar Systems",
  chains,
})

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
})

function App() {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider
        showRecentTransactions={true}
        chains={chains}
        theme={{
          ...darkTheme({ accentColor: "#7b3fe4" }),
          fonts: {
            body: "Lexend",
          },
        }}
      >
        <LandingPage />
      </RainbowKitProvider>
    </WagmiConfig>
  )
}

export default App
