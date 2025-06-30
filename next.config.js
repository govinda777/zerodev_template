// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configuração de imagens
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
  
  // Configuração das variáveis de ambiente
  env: {
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmaqqs10k00onl20md0g7c7bg',
    NEXT_PUBLIC_ZERODEV_RPC: process.env.NEXT_PUBLIC_ZERODEV_RPC || 'https://rpc.zerodev.app/api/v3/ca6057ad-912b-4760-ac3d-1f3812d63b12/chain/11155111',
    NEXT_PUBLIC_ZERODEV_PROJECT_ID: process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID || 'ca6057ad-912b-4760-ac3d-1f3812d63b12',
    NEXT_PUBLIC_CHAIN: process.env.NEXT_PUBLIC_CHAIN || 'sepolia',
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
  },
  
  // Configuração do webpack
  webpack: (config, { isServer }) => {
    // Configurações de fallback para compatibilidade com módulos do Node.js
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
    };
    
    // Adiciona polyfills necessários apenas no lado do cliente
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'crypto': 'crypto-browserify',
        'stream': 'stream-browserify',
        'http': 'stream-http',
        'https': 'https-browserify',
        'os': 'os-browserify/browser',
        'path': 'path-browserify',
      };
    }
    
    // Adiciona externals
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    return config;
  },
  
  // Configuração de headers para CSP e segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "connect-src 'self' https: wss:",
              "img-src 'self' data: https:",
              "style-src 'self' 'unsafe-inline' https:",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https:",
              "font-src 'self' https: data:",
              "frame-src 'self' https:",
              "object-src 'none'"
            ].join('; ')
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // Configuração de redirecionamento
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};

// Log das configurações carregadas (sem informações sensíveis)
console.log('Next.js Config:', {
  env: nextConfig.env ? {
    ...nextConfig.env,
    // Não logar valores sensíveis
    NEXT_PUBLIC_PRIVY_APP_ID: nextConfig.env.NEXT_PUBLIC_PRIVY_APP_ID ? '***' : undefined,
    NEXT_PUBLIC_ZERODEV_PROJECT_ID: nextConfig.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID ? '***' : undefined,
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: nextConfig.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ? '***' : undefined,
  } : {},
  images: nextConfig.images,
  reactStrictMode: nextConfig.reactStrictMode,
});

module.exports = nextConfig;
