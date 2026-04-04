"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  InterwovenKitProvider,
  TESTNET,
  initiaPrivyWalletConnector,
  injectStyles,
} from "@initia/interwovenkit-react";
import interwovenKitStyles from "@initia/interwovenkit-react/styles.js";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { dripfiConfig } from "@/lib/dripfi-config";

const wagmiConfig = createConfig({
  connectors: [initiaPrivyWalletConnector],
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
});

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    injectStyles(interwovenKitStyles);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <InterwovenKitProvider
          {...TESTNET}
          defaultChainId={dripfiConfig.chain.chain_id}
          customChain={dripfiConfig.chain}
          enableAutoSign={{
            [dripfiConfig.chain.chain_id]: ["/minievm.evm.v1.MsgCall"],
          }}
          autoSignFeePolicy={{
            [dripfiConfig.chain.chain_id]: {
              gasMultiplier: 1.2,
              maxGasMultiplierFromSim: 1.5,
              allowedFeeDenoms: [dripfiConfig.chain.native_assets[0].denom],
            },
          }}
        >
          {children}
        </InterwovenKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
