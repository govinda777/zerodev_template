// @ts-ignore - Metadata type is automatically provided by Next.js
import { Inter } from "next/font/google";
import "./globals.css";
import { PrivyProvider } from '@/providers/PrivyProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ZeroDev Token Shop",
  description: "A Web3 token shop powered by ZeroDev and Privy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PrivyProvider>
          {children}
        </PrivyProvider>
      </body>
    </html>
  );
}
