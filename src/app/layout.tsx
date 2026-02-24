import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/header'

const inter = Inter({ subsets: ['latin', 'greek'] })

export const metadata: Metadata = {
  title: 'TransparencyGov - Δήμος Καρδίτσας',
  description:
    'Δημόσια δαπάνη και διαφάνεια στον Δήμο Καρδίτσας. Στοιχεία από τη Διαύγεια.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="el">
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t bg-card py-6 text-center text-sm text-muted-foreground">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            Δεδομένα από{' '}
            <a
              href="https://diavgeia.gov.gr"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Διαύγεια
            </a>
            {' '}&middot; Δήμος Καρδίτσας
          </div>
        </footer>
      </body>
    </html>
  )
}
