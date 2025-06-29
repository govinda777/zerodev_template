import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
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
        {/* TODO: Integrar PrivyProvider e outros providers globais aqui */}
        {children}
      </body>
    </html>
  );
}
