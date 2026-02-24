'use client';

import { useEffect, useState } from 'react';
import { Playfair_Display } from 'next/font/google';
import { Search, Loader2, ShoppingBag, X } from 'lucide-react';
import { createClient } from '@/lib/client';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
  display: 'swap',
});

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  images: string[];
  inventory_quantity: number;
  is_active: boolean;
  sku: string | null;
  metadata: any;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const supabase = createClient();

  const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProducts = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!STORE_SLUG) {
        throw new Error('Store slug not configured');
      }

      // Get the store ID
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', STORE_SLUG)
        .eq('is_active', true)
        .single();

      if (storeError || !store) {
        console.error('Store error:', storeError);
        throw new Error('Store not found');
      }

      // Fetch all products for this store
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, slug, description, price, compare_at_price, images, inventory_quantity, is_active, sku, metadata')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(100);

      if (productsError) {
        console.error('Products error:', productsError);
        throw productsError;
      }

      const fetchedProducts = productsData || [];

      if (fetchedProducts.length === 0) {
        setError('No products available at the moment');
      }

      setProducts(fetchedProducts);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    if (!debouncedSearch.trim()) return true;

    const searchLower = debouncedSearch.toLowerCase().trim();
    const name = product.name?.toLowerCase() || '';
    const description = product.description?.toLowerCase() || '';
    const sku = product.sku?.toLowerCase() || '';

    // Search in metadata if it contains product type or category
    const metadataStr = JSON.stringify(product.metadata || {}).toLowerCase();

    return (
      name.includes(searchLower) ||
      description.includes(searchLower) ||
      sku.includes(searchLower) ||
      metadataStr.includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex justify-center items-center min-h-[60vh]">
            <Alert variant="destructive" className="max-w-md">
              <ShoppingBag className="h-5 w-5" />
              <AlertTitle>Error Loading Products</AlertTitle>
              <AlertDescription className="mt-2">
                {error}
                <Button
                  onClick={fetchProducts}
                  variant="outline"
                  className="mt-4 w-full"
                >
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl md:text-5xl font-light tracking-tight mb-4 ${playfairDisplay.className}`}>
            The Full <span className="text-primary">Collection</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8 font-light">
            Premium hair care, elegant jewelry, and beauty essentials for your unique style
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 h-12"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Search Results Counter */}
            {debouncedSearch && (
              <p className="text-sm text-muted-foreground mt-3">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'} for "{debouncedSearch}"
              </p>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Card className="max-w-md mx-auto border-border/50">
              <CardContent className="pt-12 pb-12">
                <div className="w-20 h-20 bg-muted flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-light mb-3">
                  {debouncedSearch ? 'No Products Found' : 'No Products Available'}
                </h3>
                <p className="text-muted-foreground mb-6 font-light">
                  {debouncedSearch
                    ? `We couldn't find any products matching "${debouncedSearch}".`
                    : 'Check back soon for new arrivals.'
                  }
                </p>
                {debouncedSearch && (
                  <Button onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const imageUrl = Array.isArray(product.images) && product.images.length > 0
                  ? product.images[0]
                  : '/placeholder-product.jpg';

                const stock = product.inventory_quantity;
                const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
                const discount = hasDiscount
                  ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
                  : 0;

                return (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      title: product.name,
                      handle: product.slug,
                      name: product.name,
                      description: product.description || '',
                      price: product.price,
                      discount: discount,
                      image: imageUrl,
                      altText: product.name,
                      brand: product.metadata?.brand || "Loc'd Essence",
                      variants: { edges: [] }, // Variants can be fetched separately if needed
                      inStock: stock > 0,
                      stock: stock,
                      rating: product.metadata?.rating || 4.5,
                      reviews: product.metadata?.reviews || 0,
                      isNew: product.metadata?.isNew || false,
                      slug: product.slug,
                      category: product.metadata?.category || 'Uncategorized',
                      sku: product.sku || product.id
                    }}
                  />
                );
              })}
            </div>

            {/* Results Summary */}
            <div className="mt-12 text-center">
              <p className="text-muted-foreground text-sm font-light">
                Showing <span className="font-normal text-foreground">{filteredProducts.length}</span> of{' '}
                <span className="font-normal text-foreground">{products.length}</span> products
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
