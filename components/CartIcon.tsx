'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { ShoppingCart } from 'lucide-react'

export default function CartIcon() {
  const { itemCount } = useCart()

  return (
    <Link href="/cart" className="relative p-2 text-gray-700 hover:text-indigo-600">
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Link>
  )
}