// src/context/FavoritesContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types';

type FavoriteItem = {
  id: string;
  variantId: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  brand: string;
  inStock: boolean;
  addedAt: string;
};

type FavoritesContextType = {
  favorites: FavoriteItem[];
  addToFavorites: (product: Product) => void;
  removeFromFavorites: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
  loading: boolean;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('shopify-favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading favorites from localStorage:', error);
      }
    }
  }, []);

  // Save favorites to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem('shopify-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (product: Product) => {
    setLoading(true);
    
    const favoriteItem: FavoriteItem = {
      id: product.id,
      variantId: product.variants.edges[0].node.id,
      name: product.title || product.name,
      price: product.price,
      image: product.featuredImage?.url || product.image,
      slug: product.slug,
      brand: product.brand,
      inStock: product.inStock,
      addedAt: new Date().toISOString(),
    };

    setFavorites(prev => {
      // Check if item already exists
      if (prev.some(item => item.id === product.id)) {
        return prev;
      }
      return [...prev, favoriteItem];
    });
    
    setLoading(false);
  };

  const removeFromFavorites = (productId: string) => {
    setLoading(true);
    setFavorites(prev => prev.filter(item => item.id !== productId));
    setLoading(false);
  };

  const isFavorite = (productId: string) => {
    return favorites.some(item => item.id === productId);
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return (
    <FavoritesContext.Provider 
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        clearFavorites,
        loading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}