'use client';

import { PrivyProvider as Provider } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { Environment } from '@/config/Environment';
import { useEffect } from 'react';
import { logEnv } from '@/utils/envCheck';

// Configuração das redes suportadas
const supportedChains = [Environment.config.defaultChain];

// Configuração da carteira
const walletConfig = {
  walletConnect: {
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
  },
};

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Log environment variables on client-side
  useEffect(() => {
    console.log('=== PrivyProvider Mounted ===');
    logEnv();
    
    // Log Privy config
    console.log('Privy Config:', {
      appId: Environment.config.appId ? '***' : 'Not set',
      defaultChain: Environment.config.defaultChain,
      supportedChains: supportedChains,
      hasAppearance: !!Environment.config.appearance
    });
  }, []);

  const privyConfig = {
    // Configuração do Privy
    loginMethods: ['wallet', 'google'],
    defaultChain: Environment.config.defaultChain,
    supportedChains: supportedChains,
    appearance: Environment.config.appearance,
  };

  return (
    <Provider
      appId={Environment.config.appId}
      config={privyConfig}
      onSuccess={(user) => {
        console.log('=== Login bem-sucedido ===');
        console.log('User:', user);
        router.push('/dashboard');
      }}
      // @ts-ignore - O Privy não expõe corretamente o tipo do onError
      onError={(error: Error) => {
        console.error('=== Erro no login ===');
        console.error('Error:', error);
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }}
    >
      {children}
    </Provider>
  );
}
