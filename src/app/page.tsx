'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const { authenticated } = usePrivy();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Redirecionar para o dashboard se já estiver autenticado
  useEffect(() => {
    if (authenticated) {
      router.push('/dashboard');
    } else {
      setIsLoading(false);
    }
  }, [authenticated, router]);

  // Mostrar um carregamento enquanto verifica a autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 md:p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Bem-vindo ao ZeroDev Token Shop!
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:size-auto lg:bg-none">
          {/* Logo ou branding */}
        </div>
      </div>

      <div className="relative z-[-1] flex flex-col items-center text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          ZeroDev Token Shop
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
          Uma loja de tokens segura e descentralizada usando carteiras inteligentes
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <a
            href="/auth"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Comece Agora
          </a>
          <a
            href="#features"
            className="px-6 py-3 border border-gray-300 dark:border-gray-700 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Saiba Mais
          </a>
        </div>
      </div>

      <div id="features" className="w-full max-w-5xl mt-20 mb-32">
        <h2 className="text-3xl font-bold text-center mb-12">Recursos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Carteira Inteligente</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Utilize carteiras inteligentes para transações seguras e sem atrito.
            </p>
          </div>

          <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Compre Tokens</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Adquira tokens com facilidade usando sua carteira preferida.
            </p>
          </div>

          <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Transações Seguras</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Todas as transações são seguras e verificadas na blockchain.
            </p>
          </div>
        </div>
      </div>

      <footer className="w-full border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-600 dark:text-gray-400">
                {new Date().getFullYear()} ZeroDev Token Shop. Todos os direitos reservados.
              </p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                Termos de Serviço
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                Política de Privacidade
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                Contato
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
