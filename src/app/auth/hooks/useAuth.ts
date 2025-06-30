import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth() {
  const { authenticated, user } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (authenticated) {
      router.push('/dashboard');
    }
  }, [authenticated, router]);

  return {
    isAuthenticated: authenticated,
    user,
  };
}
