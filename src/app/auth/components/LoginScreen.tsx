'use client';

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Modal, Alert, Space, Typography, Divider } from 'antd';
import { AuthButton } from '@/components/AuthButton';
import { useRouter } from 'next/navigation';

interface LoginScreenProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onClose, onSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const { login, authenticated: isAuthenticated, user } = usePrivy();
  const router = useRouter();

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      onSuccess?.();
      router.push('/dashboard');
    }
  }, [isAuthenticated, router, onSuccess]);

  return (
    <Modal
      open={true}
      onCancel={onClose}
      footer={null}
      width={400}
      centered
    >
      <div style={{ padding: '24px' }}>
        <Typography.Title level={3} style={{ marginBottom: '24px' }}>
          Faça Login
        </Typography.Title>
        
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <AuthButton method="wallet" />
          <Divider plain>ou</Divider>
          <AuthButton method="google" />
        </Space>
      </div>
    </Modal>
  );
};

export default LoginScreen;
