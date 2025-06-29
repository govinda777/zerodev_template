# AGENTS.md - Diretrizes para o Agente AI (Jules)

Este arquivo contém diretrizes específicas para o desenvolvimento do projeto ZeroDev Token Shop.

## 🚀 Visão Geral do Projeto

Recriar completamente o projeto ZeroDev Token Shop para funcionar 100% com blockchain real, sem simulações ou fallbacks para localStorage. O projeto deve ser completamente testável com testes unitários e E2E (Playwright), visando 100% de cobertura.

## 🛠️ Stack Tecnológica (MANTER)

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Autenticação**: Privy (autenticação Web3 com suporte a social login)
- **Account Abstraction**: ZeroDev SDK
- **Blockchain Interaction**: Viem
- **Estado Global**: React Context API

### Blockchain & Smart Contracts
- **Framework**: Hardhat
- **Linguagem**: Solidity ^0.8.20
- **Rede**: Sepolia Testnet (principal) + Localhost (desenvolvimento)
- **Padrões**: OpenZeppelin (ERC20, Ownable, ReentrancyGuard, Pausable)

### Testes
- **Testes Unitários**: Jest + React Testing Library
- **Testes E2E**: Playwright
- **Testes de Contratos**: Hardhat Test Suite
- **Coverage**: 100% de cobertura obrigatória

### DevOps & Qualidade
- **Linting**: ESLint + TypeScript ESLint
- **Git Hooks**: Husky (pre-commit, pre-push)
- **CI/CD**: GitHub Actions
- **Environment**: dotenv

## 🚨 REGRAS CRÍTICAS

### ❌ PROIBIDO:
- **localStorage para dados blockchain**: Qualquer estado relacionado à blockchain (saldos, histórico de compras, etc.) deve vir diretamente dos contratos ou ser derivado de eventos on-chain. O localStorage só pode ser usado para preferências de UI (ex: tema escuro/claro, se aplicável) ou dados não críticos que não se relacionam com o estado da blockchain.
- **Simulações ou mocks em produção**: Todas as interações devem ser com a blockchain real.
- **Fallbacks para dados fictícios**: Se os dados não puderem ser carregados da blockchain, deve-se exibir um estado de erro ou carregamento apropriado.
- **Operações sem confirmação blockchain**: O estado da UI só deve ser atualizado para refletir uma mudança permanente após a confirmação da transação na blockchain.
- **UI sem loading states**: Todas as operações assíncronas (especialmente interações com a blockchain) devem ter feedback visual claro (loading spinners, desabilitar botões, etc.).
- **Transações sem error handling**: Implementar tratamento de erros robusto e mensagens claras para o usuário quando as transações falharem.

### ✅ OBRIGATÓRIO:
- **Todas as operações via Smart Contracts**: A lógica de negócios principal deve residir nos smart contracts.
- **Error handling robusto**: Capturar e tratar erros de contratos, rede, Privy, ZeroDev, etc.
- **Loading states em todas as operações**: Para chamadas de contrato, espera de transações, etc.
- **Confirmação de transações**: Aguardar a mineração e confirmação das transações antes de considerar a operação como concluída.
- **Logs detalhados para debugging**: Utilizar `console.log` ou um sistema de logging mais robusto durante o desenvolvimento para facilitar o debugging.
- **Testes para todos os cenários**: Cobrir casos de sucesso, falha, e casos extremos.
- **100% Test Coverage** (unitários + integração de contratos).
- **Performance Score > 90** (Lighthouse).
- **Acessibilidade WCAG 2.1 AA**.
- **Zero TypeScript errors** (compilação bem-sucedida em modo strict).
- **Zero ESLint warnings**.

## ✍️ Convenções de Código

- Seguir as melhores práticas para Solidity, TypeScript, React.
- Manter o código limpo, bem documentado e modular.
- Usar nomes descritivos para variáveis, funções e arquivos.
- Comentários devem explicar o *porquê* do código, não o *o quê*.

## 🧪 Testes

- **Contratos**: Testes com Hardhat, cobrindo todos os `require`, `revert`, eventos e lógicas de estado.
- **Frontend Unitário**: Jest + React Testing Library para hooks e componentes. Testar lógica, renderização condicional, interações do usuário e tratamento de estados (loading, error, success).
- **Frontend E2E**: Playwright para fluxos de usuário completos. Os testes devem interagir com uma blockchain de teste real (Hardhat node ou Sepolia).

## 🚀 Deployment

- Scripts de deploy devem ser idempotentes e reutilizáveis.
- Endereços de contratos devem ser gerenciados através dos arquivos `deployments/*.json` e variáveis de ambiente.

Lembre-se, Jules: **Sem atalhos, sem simulações, apenas blockchain real funcionando perfeitamente.** Sua atenção a estas diretrizes é crucial para o sucesso do projeto.
