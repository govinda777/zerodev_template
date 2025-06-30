'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button, Card, Typography, Space, Avatar, Divider } from 'antd';
import { LogOut } from 'lucide-react';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { user, logout, authenticated } = usePrivy();
  
  // Função para formatar o endereço da carteira
  const formatAddress = (address?: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <Title level={3} className="text-center">Acesso não autorizado</Title>
          <Text className="block text-center mb-4">Você precisa estar logado para acessar esta página.</Text>
          <Button 
            type="primary" 
            href="/auth" 
            className="w-full"
          >
            Ir para o Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <Title level={2}>Dashboard</Title>
        <Button 
          type="default" 
          icon={<LogOut size={16} />}
          onClick={logout}
        >
          Sair
        </Button>
      </div>
      
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Avatar 
            src={user?.email ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random` : undefined}
            size={64}
            className="bg-gray-200"
          >
            {user?.wallet?.address ? user.wallet.address.slice(0, 2).toUpperCase() : 'US'}
          </Avatar>
          <div>
            <Title level={4} className="mb-1">
              {user?.email || 'Usuário'}
            </Title>
            {user?.wallet?.address && (
              <Text type="secondary" copyable>
                {formatAddress(user.wallet.address)}
              </Text>
            )}
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Carteira" className="h-full">
          <Space direction="vertical" size="middle" className="w-full">
            <div className="flex justify-between">
              <Text>Saldo:</Text>
              <Text strong>0.00 TOKENS</Text>
            </div>
            <Divider className="my-2" />
            <Button type="primary" block>
              Comprar Tokens
            </Button>
          </Space>
        </Card>
        
        <Card title="Atividades Recentes" className="h-full">
          <div className="text-center py-4">
            <Text type="secondary">Nenhuma atividade recente</Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
