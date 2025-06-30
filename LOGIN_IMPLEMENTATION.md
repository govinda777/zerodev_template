# Sistema de Autenticação com Múltiplos Provedores

## Descrição
Este sistema implementa um componente de login moderno e seguro que suporta múltiplos métodos de autenticação:
- Login com carteira de criptomoedas (Metamask)
- Login com Google
- Login com Twitter
- Login com Email

O sistema utiliza a biblioteca Privy para gerenciar a autenticação, fornecendo uma experiência segura e integrada com diferentes provedores de autenticação. A interface é responsiva e utiliza componentes do Ant Design para uma experiência visual consistente.

## Características Principais
- Interface moderna e responsiva
- Suporte a múltiplos métodos de login
- Feedback visual durante o processo de login
- Tratamento de erros e estados de loading
- Testes automatizados (unitários e E2E)
- Integração com redes blockchain (Ethereum e Polygon)
- Suporte a autenticação social (Google e Twitter)

## 1. Instalação das Dependências
```bash
# Instalar dependências principais
npm install @privy-io/react-auth @ant-design/icons antd react-router-dom

# Instalar dependências de teste
npm install -D @testing-library/react @testing-library/jest-dom jest
```

## 2. Configuração do Projeto

### 2.1 Criar arquivo `.env`
```bash
REACT_APP_ENV=development
REACT_APP_INFURA_KEY=seu-infura-key
```

### 2.2 Criar classe de configuração
```typescript
// src/config/Environment.ts
import { defineConfig } from '@privy-io/react-auth';

export class Environment {
  static readonly config = {
    privy: {
      appId: process.env.REACT_APP_PRIVY_APP_ID,
      projectId: process.env.REACT_APP_PRIVY_PROJECT_ID
    },
    google: {
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID
    },
    twitter: {
      apiKey: process.env.REACT_APP_TWITTER_API_KEY,
      apiSecret: process.env.REACT_APP_TWITTER_API_SECRET
    },
    networks: {
      ethereum: {
        rpcUrl: process.env.REACT_APP_INFURA_KEY 
          ? `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`
          : 'http://localhost:8545'
      },
      polygon: {
        rpcUrl: process.env.REACT_APP_INFURA_KEY 
          ? `https://polygon-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`
          : 'http://localhost:8546'
      }
    }
  };

  static get privyConfig() {
    return defineConfig({
      loginMethods: ['metamask', 'google', 'twitter', 'email'],
      walletConfig: {
        networks: ['ethereum', 'polygon'],
        rpcUrls: {
          ethereum: this.config.networks.ethereum.rpcUrl,
          polygon: this.config.networks.polygon.rpcUrl
        }
      },
      googleConfig: {
        clientId: this.config.google.clientId
      },
      twitterConfig: {
        apiKey: this.config.twitter.apiKey,
        apiSecret: this.config.twitter.apiSecret
      }
    });
  }

  static get isDevelopment() {
    return process.env.REACT_APP_ENV === 'development';
  }

  static get isProduction() {
    return process.env.REACT_APP_ENV === 'production';
  }

  static validate() {
    if (!this.config.pri

### 2.2 Criar estrutura de diretórios
```bash
mkdir -p src/components/auth/screens
mkdir -p src/tests/auth
```

## 3. Implementação do LoginScreen

### 3.1 Criar LoginScreen.tsx
```typescript
// src/components/auth/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Space } from 'antd';
import { GoogleOutlined, TwitterOutlined, MailOutlined, WalletOutlined } from '@ant-design/icons';

interface LoginScreenProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = usePrivy();
  const navigate = useNavigate();

  const handleLogin = async (method: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await login({
        method,
        onSuccess: () => {
          onSuccess?.();
          navigate('/dashboard');
        },
        onError: (err) => {
          setError(err.message);
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      open={true}
      onCancel={onClose}
      footer={null}
      width={400}
      centered
    >
      <div className="login-container">
        <h2 className="text-center mb-4">Login</h2>
        
        {error && (
          <div className="alert alert-danger mb-4">
            {error}
          </div>
        )}

        <Space direction="vertical" size="large" className="w-full">
          <Button 
            type="primary" 
            loading={loading}
            onClick={() => handleLogin('metamask')}
            icon={<WalletOutlined />}
            className="w-full"
          >
            Login com Metamask
          </Button>

          <Button 
            type="default" 
            loading={loading}
            onClick={() => handleLogin('google')}
            icon={<GoogleOutlined />}
            className="w-full"
          >
            Login com Google
          </Button>

          <Button 
            type="default" 
            loading={loading}
            onClick={() => handleLogin('twitter')}
            icon={<TwitterOutlined />}
            className="w-full"
          >
            Login com Twitter
          </Button>

          <Button 
            type="default" 
            loading={loading}
            onClick={() => handleLogin('email')}
            icon={<MailOutlined />}
            className="w-full"
          >
            Login com Email
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default LoginScreen;
```

### 3.2 Configurar App.tsx
```typescript
// src/App.tsx
import { PrivyProvider } from '@privy-io/react-auth';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginScreen from './components/auth/screens/LoginScreen';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Router>
      <PrivyProvider 
        appId={Environment.config.pri

## 4. Testes com Playwright

### 4.1 Instalar Playwright
```bash
npm install -D @playwright/test
```

### 4.2 Configurar Playwright
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### 4.3 Criar testes mockados
```typescript
// tests/LoginScreen.spec.ts
import { test, expect } from '@playwright/test';
import { mockPrivyLogin } from './mocks/privy';

test.beforeEach(async ({ page }) => {
  // Mock do Privy
  await mockPrivyLogin(page);
  
  // Navegar para a página de login
  await page.goto('/login');
});

test('deve renderizar os botões de login', async ({ page }) => {
  await expect(page.getByText('Login com Metamask')).toBeVisible();
  await expect(page.getByText('Login com Google')).toBeVisible();
  await expect(page.getByText('Login com Twitter')).toBeVisible();
  await expect(page.getByText('Login com Email')).toBeVisible();
});

test('deve mostrar estado de loading durante o login', async ({ page }) => {
  // Clicar no botão de login
  const loginButton = page.getByText('Login com Metamask');
  await loginButton.click();
  
  // Verificar se o botão está em estado de loading
  await expect(loginButton).toHaveAttribute('loading', 'true');
});

test('deve mostrar mensagem de erro em falha', async ({ page }) => {
  // Mock de falha no login
  await page.route('**/login', route => {
    route.fulfill({
      status: 401,
      body: JSON.stringify({ error: 'Credenciais inválidas' })
    });
  });
  
  // Tentar login
  await page.getByText('Login com Google').click();
  
  // Verificar mensagem de erro
  await expect(page.getByText('Credenciais inválidas')).toBeVisible();
});

test('deve redirecionar para dashboard em sucesso', async ({ page }) => {
  // Mock de sucesso no login
  await page.route('**/login', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ success: true })
    });
  });
  
  // Realizar login
  await page.getByText('Login com Twitter').click();
  
  // Verificar redirecionamento
  await expect(page).toHaveURL('/dashboard');
});
```

### 4.4 Criar mocks do Privy
```typescript
// tests/mocks/privy.ts
import { Page } from '@playwright/test';

export async function mockPrivyLogin(page: Page) {
  // Mock do PrivyProvider
  await page.route('**/privy/config', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        loginMethods: ['metamask', 'google', 'twitter', 'email'],
        walletConfig: {
          networks: ['ethereum', 'polygon']
        }
      })
    });
  });

  // Mock do login
  await page.route('**/privy/login', route => {
    const request = JSON.parse(route.request().postData() || '{}');
    
    if (request.method === 'metamask') {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          address: '0x123...',
          network: 'ethereum'
        })
      });
    } else {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          email: 'test@example.com',
          provider: request.method
        })
      });
    }
  });
}
```

## 5. Testes E2E com Playwright

### 5.1 Estrutura de Testes
A estrutura de testes E2E segue a seguinte organização:
```
tests/
├── e2e/
│   ├── login/
│   │   ├── login.spec.ts          # Testes do fluxo de login
│   │   ├── wallet.spec.ts         # Testes específicos para login com carteira
│   │   ├── social.spec.ts         # Testes para login social (Google/Twitter)
│   │   └── email.spec.ts          # Testes para login por email
│   ├── dashboard/
│   │   ├── navigation.spec.ts     # Testes de navegação
│   │   └── user.spec.ts           # Testes de funcionalidades do usuário
│   └── utils/
│       ├── privy.ts               # Mocks e utilitários do Privy
│       └── auth.ts                # Funções de autenticação
└── fixtures/
    ├── user.json                  # Dados de usuários de teste
    └── wallet.json                # Dados de carteira de teste
```

### 5.2 Configuração Avançada
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['junit', { outputFile: 'results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    }
  ],
});
```

### 5.3 Testes de Login
```typescript
// tests/e2e/login/login.spec.ts
import { test, expect } from '@playwright/test';
import { mockPrivyLogin } from '../utils/privy';
import { testUser } from '../fixtures/user';

test.describe('Fluxo de Login', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar mocks
    await mockPrivyLogin(page);
    // Navegar para página de login
    await page.goto('/login');
  });

  test('deve permitir login com carteira', async ({ page }) => {
    // Mock de carteira
    await page.route('**/wallet/connect', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          address: testUser.walletAddress,
          network: 'ethereum'
        })
      });
    });

    // Realizar login
    await page.getByText('Login com Metamask').click();
    await expect(page).toHaveURL('/dashboard');

    // Verificar informações do usuário
    const userMenu = page.getByTestId('user-menu');
    await expect(userMenu).toContainText(testUser.walletAddress.slice(0, 6));
  });

  test('deve permitir login com Google', async ({ page }) => {
    // Mock de login Google
    await page.route('**/auth/google', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          email: testUser.email,
          name: testUser.name
        })
      });
    });

    // Realizar login
    await page.getByText('Login com Google').click();
    await expect(page).toHaveURL('/dashboard');

    // Verificar informações do usuário
    const userMenu = page.getByTestId('user-menu');
    await expect(userMenu).toContainText(testUser.email);
  });

  test('deve mostrar erro em login inválido', async ({ page }) => {
    // Mock de erro
    await page.route('**/auth/login', route => {
      route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Credenciais inválidas' })
      });
    });

    // Tentar login
    await page.getByText('Login com Email').click();
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Senha').fill('123456');
    await page.getByText('Entrar').click();

    // Verificar mensagem de erro
    await expect(page.getByTestId('error-message')).toContainText('Credenciais inválidas');
  });
});
```

### 5.4 Fixtures de Teste
```typescript
// tests/fixtures/user.ts
export const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  walletAddress: '0x123...',
  googleId: '1234567890',
  twitterHandle: '@testuser'
};

export const testWallet = {
  privateKey: '0x...',
  address: '0x123...',
  network: 'ethereum',
  balance: '1000000000000000000' // 1 ETH
};
```

### 5.5 Executando os Testes
```bash
# Executar todos os testes
npm test

# Executar testes específicos
npm test -- tests/e2e/login/login.spec.ts

# Executar em modo visual
npx playwright test --ui

# Gerar relatório HTML
npx playwright test --reporter=html

# Executar em modo headless
npx playwright test --headed

# Executar em um navegador específico
npx playwright test --project=chromium

# Executar com vídeos e screenshots
npx playwright test --video=on --screenshot=on
```

### 5.6 Melhores Práticas
1. **Isolamento de Testes**:
   - Cada teste deve ser independente
   - Limpe o estado entre testes
   - Use dados de teste específicos

2. **Timeouts**:
   - Configure timeouts adequados
   - Use `page.waitForSelector()` para elementos
   - Use `page.waitForResponse()` para APIs

3. **Logging**:
   - Adicione logs detalhados
   - Use `console.log()` para debug
   - Configure logs no reporter

4. **Performance**:
   - Use `test.slow()` para testes lentos
   - Configure `retries` para CI
   - Use `test.skip()` para testes instáveis

## 6. Estilos CSS (Opcional)
```css
/* src/components/auth/screens/LoginScreen.css */
.login-container {
  padding: 24px;
}

.alert {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.alert-danger {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.w-full {
  width: 100%;
}
```

## 8. Instruções Finais

1. Substitua `YOUR_INFURA_KEY` com sua chave da Infura
2. Configure as variáveis de ambiente no arquivo `.env`
3. Execute os testes:
   ```bash
   # Testes unitários
   npm test
   ```

4. Para rodar a aplicação:
   ```bash
   # Iniciar o servidor de desenvolvimento
   npm start

   # Executar testes unitários
   npm test

   # Executar testes E2E
   npx playwright test

   # Executar testes E2E em modo visual
   npx playwright test --ui
   ```
