declare module '@privy-io/react-auth' {
  import { ReactNode } from 'react';
  import { Chain } from 'viem';

  export interface PrivyConfig {
    loginMethods?: string[];
    defaultChain: Chain;
    supportedChains: Chain[];
    appearance?: {
      theme?: 'light' | 'dark' | `#${string}`;
      accentColor?: `#${string}`;
      logo?: string | React.ReactElement;
      walletList?: string[];
      showWalletLoginFirst?: boolean;
      walletChainType?: 'ethereum-only' | 'all' | 'custom';
    };
  }

  export interface User {
    id: string;
    email?: string;
    phone?: string;
    wallet?: {
      address: string;
      chainId: number;
    };
  }

  export interface PrivyProviderProps {
    appId: string;
    config: PrivyConfig;
    onSuccess?: (user: User) => void;
    onError?: (error: Error) => void;
    children: ReactNode;
  }

  export const PrivyProvider: React.FC<PrivyProviderProps>;
  export function usePrivy(): {
    login: (options?: { method?: string }) => Promise<void>;
    logout: () => Promise<void>;
    user: User | null;
    authenticated: boolean;
    loading: boolean;
    error: Error | null;
  };

  export function defineConfig(config: PrivyConfig): PrivyConfig;
}
