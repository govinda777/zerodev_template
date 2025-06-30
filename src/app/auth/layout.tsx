// @ts-ignore - Metadata type is automatically provided by Next.js

export const metadata = {
  title: 'Login - ZeroDev Template',
  description: 'Faça login para acessar o dashboard',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
