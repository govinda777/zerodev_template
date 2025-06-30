'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from 'antd';
import { WalletOutlined, GoogleOutlined } from '@ant-design/icons';

type AuthMethod = 'wallet' | 'google';

interface AuthButtonProps {
  method: AuthMethod;
  block?: boolean;
  size?: 'large' | 'middle' | 'small';
}

export function AuthButton({ method, block = true, size = 'large' }: AuthButtonProps) {
  const { login } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  
  const buttonConfig = {
    wallet: {
      icon: <WalletOutlined />,
      text: 'Conectar Carteira',
      onClick: async () => {
        try {
          setIsLoading(true);
          await login({ method: 'wallet' });
        } finally {
          setIsLoading(false);
        }
      },
    },
    google: {
      icon: <GoogleOutlined />,
      text: 'Continuar com Google',
      onClick: async () => {
        try {
          setIsLoading(true);
          await login({ method: 'google' });
        } finally {
          setIsLoading(false);
        }
      },
    },
  };

  return (
    <Button
      type="primary"
      icon={buttonConfig[method].icon}
      onClick={buttonConfig[method].onClick}
      loading={isLoading}
      block={block}
      size={size}
      className="flex items-center justify-center gap-2"
    >
      {buttonConfig[method].text}
    </Button>
  );
}
