import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { CartProvider } from '../context/CartContext'
import { AuthProvider } from '../context/AuthContext'
import { FavoritesProvider } from '@/context/FavoritesContext'
import { NotificationProvider } from '@/context/NotificationContext'


const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfairDisplay = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair-display' })

export const metadata: Metadata = {
  title: 'Loc\'d Essence',
  description: 'Every product is designed to celebrate your natural beauty and nourish your roots',
  icons: {
    icon: '/creator.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${playfairDisplay.variable} flex flex-col w-full min-h-screen`}>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <NotificationProvider>

                <Navbar />
                <main className={`w-full mx-auto`}>
                  {children}
                </main>
                <Footer />
              </NotificationProvider>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}