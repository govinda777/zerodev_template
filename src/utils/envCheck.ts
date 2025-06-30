// Debug utility to check environment variables
export function logEnv() {
  if (typeof window === 'undefined') {
    // Server-side
    console.log('=== Server-side Environment Variables ===');
    console.log('NEXT_PUBLIC_PRIVY_APP_ID:', process.env.NEXT_PUBLIC_PRIVY_APP_ID ? '***' : 'Not set');
    console.log('NEXT_PUBLIC_ZERODEV_RPC:', process.env.NEXT_PUBLIC_ZERODEV_RPC ? '***' : 'Not set');
    console.log('NEXT_PUBLIC_ZERODEV_PROJECT_ID:', process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID ? '***' : 'Not set');
  } else {
    // Client-side
    console.log('=== Client-side Environment Variables ===');
    console.log('NEXT_PUBLIC_PRIVY_APP_ID:', (window as any).NEXT_PUBLIC_PRIVY_APP_ID ? '***' : 'Not set');
  }
}
