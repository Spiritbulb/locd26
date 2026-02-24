'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Playfair_Display } from 'next/font/google';
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Star,
  Loader2,
  Grid,
  List,
  Search,
  Package,
  Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/client';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

interface CollectionProduct {
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

interface CollectionData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  products: CollectionProduct[];
}

export default function CollectionDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const supabase = createClient();

  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'mid' | 'high'>('all');

  const { addToCart, loading: cartLoading } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG;

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'title-asc', label: 'A-Z' },
    { value: 'title-desc', label: 'Z-A' }
  ];

  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: 'low', label: 'Under KES 2,000' },
    { value: 'mid', label: 'KES 2,000 - KES 10,000' },
    { value: 'high', label: 'Over KES 10,000' }
  ];

  const fetchCollection = async () => {
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

      // Fetch collection by slug
      const { data: collectionData, error: collectionError } = await supabase
        .from('collections')
        .select('*')
        .eq('store_id', store.id)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (collectionError || !collectionData) {
        console.error('Collection error:', collectionError);
        setError('Collection not found');
        return;
      }

      // Fetch products in this collection
      const { data: collectionProducts, error: cpError } = await supabase
        .from('collection_products')
        .select('product_id, position')
        .eq('collection_id', collectionData.id)
        .order('position', { ascending: true });

      if (cpError) {
        console.error('Collection products error:', cpError);
        throw cpError;
      }

      if (!collectionProducts || collectionProducts.length === 0) {
        setCollection({
          ...collectionData,
          products: []
        });
        return;
      }

      const productIds = collectionProducts.map(cp => cp.product_id);

      // Fetch full product details
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('is_active', true);

      if (productsError) {
        console.error('Products error:', productsError);
        throw productsError;
      }

      // Sort products by their position in collection
      const sortedProducts = (productsData || []).sort((a, b) => {
        const posA = collectionProducts.find(cp => cp.product_id === a.id)?.position || 0;
        const posB = collectionProducts.find(cp => cp.product_id === b.id)?.position || 0;
        return posA - posB;
      });

      setCollection({
        ...collectionData,
        products: sortedProducts
      });
    } catch (err: any) {
      console.error('Error fetching collection:', err);
      setError(err.message || 'Failed to fetch collection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchCollection();
    }
  }, [slug]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
    }).format(price);
  };

  const handleAddToCart = async (product: CollectionProduct) => {
    try {
      await addToCart({
        id: product.id,
        variantId: product.sku || product.id, // Use SKU or product ID as variant
        name: product.name,
        price: product.price,
        image: product.images[0] || '',
        productId: product.id, // Add this for cart validation
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleToggleFavorite = (product: CollectionProduct) => {
    if (isFavorite(product.id)) {
      removeFromFavorites(product.id);
    } else {
      addToFavorites({
        id: product.id,
        title: product.name,
        name: product.name,
        handle: product.slug,
        description: product.description || '',
        slug: product.slug,
        price: product.price,
        image: product.images[0] || '',
        brand: product.metadata?.productType || 'Product',
        rating: product.metadata?.rating || 4,
        reviews: product.metadata?.reviews || 0,
        inStock: product.inventory_quantity > 0,
        stock: product.inventory_quantity,
        isNew: false,
        category: product.metadata?.category || 'Uncategorized',
        sku: product.sku || product.id
      });
    }
  };

  const filteredAndSortedProducts = collection?.products
    .filter((product) => {
      const matchesSearch = searchQuery === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(product.metadata?.tags || []).toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const price = product.price;

      const matchesPrice = priceRange === 'all' ||
        (priceRange === 'low' && price < 2000) ||
        (priceRange === 'mid' && price >= 2000 && price <= 10000) ||
        (priceRange === 'high' && price > 10000);

      return matchesPrice;
    })
    .sort((a, b) => {
      const priceA = a.price;
      const priceB = b.price;

      switch (sortBy) {
        case 'price-low':
          return priceA - priceB;
        case 'price-high':
          return priceB - priceA;
        case 'title-asc':
          return a.name.localeCompare(b.name);
        case 'title-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0; // Featured - keep collection order
      }
    }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground font-light">Loading collection...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex justify-center items-center min-h-[60vh]">
            <Alert variant="destructive" className="max-w-md">
              <AlertTitle>Collection Not Found</AlertTitle>
              <AlertDescription className="mt-2">
                {error || "The collection you're looking for doesn't exist."}
                <Button variant="outline" className="mt-4 w-full" asChild>
                  <Link href="/collections">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Collections
                  </Link>
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
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Button variant="ghost" className="mb-8 -ml-4" asChild>
          <Link href="/collections">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collections
          </Link>
        </Button>

        {/* Collection Header */}
        <div className="mb-12">
          {collection.image_url && (
            <Card className="overflow-hidden border-border/50 mb-8 py-0">
              <div className="relative h-64 lg:h-80">
                <Image
                  src={collection.image_url}
                  alt={collection.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                  <div>
                    <h1 className={`${playfair.className} text-4xl lg:text-6xl font-light text-white mb-4 drop-shadow-lg`}>
                      {collection.name}
                    </h1>
                    {collection.description && (
                      <p className="text-white/90 text-lg lg:text-xl max-w-2xl mx-auto font-light drop-shadow">
                        {collection.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {!collection.image_url && (
            <div className="text-center mb-8">
              <div className="flex justify-center items-center gap-3 mb-4">
                <div className="p-3 bg-primary">
                  <Package className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-4xl lg:text-5xl font-light tracking-tight">
                  {collection.name}
                </h1>
              </div>
              {collection.description && (
                <p className="text-muted-foreground text-lg max-w-3xl mx-auto font-light">
                  {collection.description}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-center items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <span>{collection.products.length} Products</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Curated Collection</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8 p-0 shadow-none border-none ">
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                <Select value={priceRange} onValueChange={(value: any) => setPriceRange(value)}>
                  <SelectTrigger className="w-full lg:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priceRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full lg:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex border">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {filteredAndSortedProducts.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 bg-muted flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-normal mb-2">No products found</h3>
              <p className="text-muted-foreground font-light">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto'
            }`}>
            {filteredAndSortedProducts.map((product) => {
              const firstImage = product.images[0];
              const isInStock = product.inventory_quantity > 0;
              const price = product.price;

              return (
                <Card
                  key={product.id}
                  className="group overflow-hidden border-border/50 hover:border-foreground/20 transition-all py-0"
                >
                  <Link href={`/products/${product.slug}`}>
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {firstImage && (
                        <Image
                          src={firstImage}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      )}

                      <div className="absolute top-3 left-3">
                        <Badge variant={isInStock ? 'default' : 'destructive'}>
                          {isInStock ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>

                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleFavorite(product);
                        }}
                        className="absolute top-3 right-3"
                      >
                        <Heart
                          className={`h-4 w-4 ${isFavorite(product.id) ? 'fill-destructive text-destructive' : ''
                            }`}
                        />
                      </Button>
                    </div>
                  </Link>

                  <CardContent className="p-4 space-y-3">
                    <Link href={`/products/${product.slug}`}>
                      <h3 className={`${playfair.className} font-normal text-sm line-clamp-2 hover:text-primary transition-colors mb-2`}>
                        {product.name}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < Math.floor(product.metadata?.rating || 4) ? 'text-primary fill-primary' : 'text-muted'
                              }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">({product.metadata?.reviews || 24})</span>
                    </div>

                    <div className="text-lg font-light">
                      {formatPrice(price)}
                    </div>

                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={!isInStock || cartLoading}
                      className="w-full"
                      size="sm"
                    >
                      {cartLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ShoppingCart className="mr-2 h-4 w-4" />
                      )}
                      {cartLoading ? 'Adding...' : isInStock ? 'Add to Cart' : 'Out of Stock'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm font-light">
            Showing <span className="font-normal text-foreground">{filteredAndSortedProducts.length}</span> of{' '}
            <span className="font-normal text-foreground">{collection.products.length}</span> products
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>
      </div>
    </div>
  );
}
