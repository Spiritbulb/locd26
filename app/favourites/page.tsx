// src/app/favourites/page.tsx

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFavorites } from '@/context/FavoritesContext';
import { useCart } from '@/context/CartContext';

export default function FavoritesPage() {
  const { favorites, removeFromFavorites, clearFavorites } = useFavorites();
  const { addToCart, loading: cartLoading } = useCart();
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
    }).format(price);
  };

  const handleAddToCart = async (favorite: any) => {
    setLoadingProductId(favorite.id);
    try {
      await addToCart({
        id: favorite.id,
        variantId: favorite.variantId,
        name: favorite.name,
        price: favorite.price,
        image: favorite.image,
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setLoadingProductId(null);
    }
  };

  const handleRemoveFromFavorites = (productId: string) => {
    removeFromFavorites(productId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (favorites.length === 0) {
    return (
      <div className="mt-16 min-h-screen">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">My Favorites</h1>
            <p className="text-lg text-gray-600">Your wishlist is waiting to be filled</p>
          </div>

          {/* Empty State */}
          <div className="max-w-md mx-auto text-center">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-r from-[#8a6e5d] to-[#7e4507] rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">No favorites yet</h2>
            <p className="text-gray-600 mb-8">Start exploring our products and add your favorites by clicking the heart icon on any product.</p>
            <Link 
              href="/products" 
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-[#8a6e5d] to-[#7e4507] text-white font-semibold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Favorites</h1>
            <p className="text-lg text-gray-600">
              {favorites.length} {favorites.length === 1 ? 'item' : 'items'} in your wishlist
            </p>
          </div>
          
          {favorites.length > 0 && (
            <button
              onClick={clearFavorites}
              className="px-6 py-3 text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Favorites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-gradient-to-r from-[#8a6e5d] to-[#7e4507]">
                <Link href={`/products/${favorite.slug}`}>
                  <Image
                    src={favorite.image}
                    alt={favorite.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </Link>
                
                {/* Remove from favorites button */}
                <button
                  onClick={() => handleRemoveFromFavorites(favorite.id)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all duration-200"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Stock status overlay */}
                {!favorite.inStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-full">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-5">
                {/* Brand */}
                <p className="text-sm text-amber-600 font-medium mb-1">{favorite.brand}</p>
                
                {/* Product Name */}
                <Link href={`/products/${favorite.slug}`}>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-amber-600 transition-colors">
                    {favorite.name}
                  </h3>
                </Link>

                {/* Price */}
                <div className="mb-3">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(favorite.price)}
                  </span>
                </div>

                {/* Added date */}
                <p className="text-xs text-gray-500 mb-4">
                  Added on {formatDate(favorite.addedAt)}
                </p>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleAddToCart(favorite)}
                    disabled={!favorite.inStock || loadingProductId === favorite.id}
                    className={`w-full py-2.5 px-4 rounded-xl font-semibold transition-all duration-200 ${
                      favorite.inStock
                        ? 'bg-gradient-to-r from-[#8a6e5d] to-[#7e4507] text-white hover:from-[#7e4507] hover:to-[#8a6e5d] hover:shadow-lg transform hover:scale-105'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {loadingProductId === favorite.id ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Adding...
                      </div>
                    ) : favorite.inStock ? (
                      'Add to Cart'
                    ) : (
                      'Out of Stock'
                    )}
                  </button>
                  
                  <div className="flex gap-2">
                    <Link 
                      href={`/products/${favorite.slug}`}
                      className="flex-1 py-2 px-3 text-sm text-center text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </Link>
                    <button 
                      onClick={() => handleRemoveFromFavorites(favorite.id)}
                      className="flex-1 py-2 px-3 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Shopping CTA */}
        <div className="text-center mt-12">
          <Link 
            href="/products" 
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-[#8a6e5d] to-[#7e4507] text-white font-semibold rounded-xl hover:from-[#7e4507] hover:to-[#8a6e5d] transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}