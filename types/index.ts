import { ReactNode } from "react";

// src/types/index.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  rating: number;
  reviews: number;
  stock: number;
  isNew?: boolean;
  discount?: number;
  category: string;
  inStock: boolean;
  sku: string;
  brand: string;
  details?: string;
  slug: string; // Made required since we're using it for routing
  [x: string]: any; // Allow additional properties
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  inStock: boolean;
  image: string;
}

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface ProductFilters {
  categories: FilterOption[];
  priceRanges: FilterOption[];
  ratings: FilterOption[];
}

export interface ProductListingProps {
  products: Product[];
}

export interface ProductFiltersProps {
  filters: ProductFilters;
}
export interface Category {
  price: ReactNode;
  id: string;
  slug: string;
  name: string;
  image: string;
  productCount: number;
  description?: string;
}
export interface Testimonial {
  id: string;
  name: string;
  location: string;
  content: string;
  avatar: string; // Use a valid image path or URL
  rating: number; // Use a number (e.g., 1-5)
}
export interface HairTip {
  title: string;
  icon: string;
  fact: string;
}