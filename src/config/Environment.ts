import { Chain } from 'viem';

// Valores padrão para desenvolvimento local
const DEFAULT_VALUES = {
  PRIVY_APP_ID: 'cmaqqs10k00onl20md0g7c7bg',
  ZERODEV_RPC: 'https://rpc.zerodev.app/api/v3/ca6057ad-912b-4760-ac3d-1f3812d63b12/chain/11155111',
  ZERODEV_PROJECT_ID: 'ca6057ad-912b-4760-ac3d-1f3812d63b12',
  CHAIN: 'sepolia'
} as const;

// Exporta todas as variáveis de ambiente em um único local
export const EnvVars = {
  // Privy
  PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID || DEFAULT_VALUES.PRIVY_APP_ID,
  
  // ZeroDev
  ZERODEV_RPC: process.env.NEXT_PUBLIC_ZERODEV_RPC || DEFAULT_VALUES.ZERODEV_RPC,
  ZERODEV_PROJECT_ID: process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID || DEFAULT_VALUES.ZERODEV_PROJECT_ID,
  CHAIN: process.env.NEXT_PUBLIC_CHAIN || DEFAULT_VALUES.CHAIN,
  
  // WalletConnect (opcional, pode ser adicionado posteriormente)
  WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
} as const;

// Exporta as configurações que serão usadas em outros lugares
export class Environment {
  // Configuração da rede Sepolia
  static readonly sepoliaChain: Chain = {
    id: 11155111,
    name: 'Sepolia',
    nativeCurrency: {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: [EnvVars.ZERODEV_RPC],
      },
      public: {
        http: [EnvVars.ZERODEV_RPC],
      },
    },
    blockExplorers: {
      default: {
        name: 'Etherscan',
        url: 'https://sepolia.etherscan.io',
      },
    },
    testnet: true,
  };

  // Configuração principal da aplicação
  static readonly config = {
    // Configuração do Privy
    appId: EnvVars.PRIVY_APP_ID,
    
    // Configuração da rede padrão
    defaultChain: Environment.sepoliaChain,
    
    // Provedores de autenticação
    loginMethods: ['wallet', 'google'] as const,
    
    // Configuração de redes suportadas
    supportedChains: [Environment.sepoliaChain],
    
    // Configuração da interface
    appearance: {
      theme: 'light' as const,
      accentColor: '#676FFF' as `#${string}`,
      logo: '/logo.png',
    },
  };

  // Verifica se todas as variáveis de ambiente necessárias estão definidas
  static validate() {
    const requiredVars = ['PRIVY_APP_ID', 'ZERODEV_RPC', 'ZERODEV_PROJECT_ID'] as const;
    const missingVars = requiredVars.filter(varName => !EnvVars[varName]);
    
    if (missingVars.length > 0) {
      console.warn('⚠️  Variáveis de ambiente ausentes:', missingVars.join(', '));
      return false;
    }
    
    return true;
  }

  // Método para obter as variáveis de ambiente para o next.config.js
  static getNextConfigEnv() {
    return {
      NEXT_PUBLIC_PRIVY_APP_ID: EnvVars.PRIVY_APP_ID,
      NEXT_PUBLIC_ZERODEV_RPC: EnvVars.ZERODEV_RPC,
      NEXT_PUBLIC_ZERODEV_PROJECT_ID: EnvVars.ZERODEV_PROJECT_ID,
      NEXT_PUBLIC_CHAIN: EnvVars.CHAIN,
      NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: EnvVars.WALLET_CONNECT_PROJECT_ID,
    };
  }
}

// Valida as variáveis de ambiente ao carregar o módulo
Environment.validate();
