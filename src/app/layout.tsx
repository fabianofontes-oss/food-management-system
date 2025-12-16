import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { NetworkStatus } from "@/components/system/network-status"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Food Management System",
  description: "Sistema multi-loja e multi-nicho para gestão completa de pedidos de negócios de alimentação",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <NetworkStatus />
        {children}
      </body>
    </html>
  )
}
