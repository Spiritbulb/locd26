"use client";
import React, { useState, useEffect } from 'react';
import { ArrowRight, ShoppingBag, Star, Check } from 'lucide-react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import { Playfair_Display } from 'next/font/google';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

const playfairDisplay = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

// Types
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  inventory_quantity: number;
  is_active: boolean;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  product_count?: number;
  min_price?: number;
}

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const heroImage = '/heroImage.jpg';
  const productImage2 = '/productImage.png';

  // Get store slug from environment
  const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG;

  // Fetch Featured Collection Products
  const fetchFeaturedProducts = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!STORE_SLUG) {
        throw new Error('Store slug not configured');
      }

      // First, get the store ID
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', STORE_SLUG)
        .eq('is_active', true)
        .single();

      if (storeError || !store) {
        throw new Error('Store not found');
      }

      // Try to get products from "featured" collection
      const { data: featuredCollection, error: collectionError } = await supabase
        .from('collections')
        .select('id')
        .eq('store_id', store.id)
        .eq('slug', 'featured')
        .eq('is_active', true)
        .single();

      let products: Product[] = [];

      if (featuredCollection) {
        // Get products from the featured collection
        const { data: collectionProducts, error: cpError } = await supabase
          .from('collection_products')
          .select(`
            product_id,
            products (
              id,
              name,
              slug,
              description,
              price,
              compare_at_price,
              images,
              inventory_quantity,
              is_active
            )
          `)
          .eq('collection_id', featuredCollection.id)
          .order('position', { ascending: true })
          .limit(8);

        if (!cpError && collectionProducts) {
          products = collectionProducts
            .flatMap(cp => cp.products)
            .filter((p): p is Product => p !== null);
        }
      }

      // Fallback to general products if no featured collection
      if (products.length === 0) {
        const { data: allProducts, error: productsError } = await supabase
          .from('products')
          .select('id, name, slug, description, price, compare_at_price, images, inventory_quantity, is_active')
          .eq('store_id', store.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(8);

        if (productsError) throw productsError;
        products = allProducts || [];
      }

      setFeaturedProducts(products);
    } catch (err: any) {
      console.error('Error fetching featured products:', err);
      setError(err.message || 'Failed to fetch featured products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      setCollectionsLoading(true);

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

      // Get collections - simplified without product pricing
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('id, name, slug, description, image_url, position')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('position', { ascending: true })
        .limit(3);

      if (collectionsError) {
        console.error('Collections error:', collectionsError);
        throw collectionsError;
      }

      console.log('Collections loaded:', collectionsData);
      setCollections(collectionsData || []);
    } catch (err: any) {
      console.error('Error fetching collections:', err);
      setError(err.message || 'Failed to fetch collections');
    } finally {
      setCollectionsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
    fetchCollections();
  }, []);

  const heroSlides = [
    {
      title: "Your statement of confidence",
      subtitle: "Discover our bestsellers, essentials and luxurious natural blends.",
      buttonText: "Show me",
      image: heroImage,
      accent: "New Arrivals"
    },
    {
      title: "Your natural beauty",
      subtitle: "Designed for natural and textured hair types, from moisturising creams to nutrient-rich oils.",
      buttonText: "I'm ready",
      image: productImage2,
      accent: "Bestsellers",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      title: "Deep Moisture",
      description: "Natural hair thrives with our hydrating and moisturizing products. Use them daily to enjoy maximum glow on your hair.",
    },
    {
      title: "Night Protection",
      description: "Satin pillowcases and silk scarves reduce breakage while you sleep, preserving your hair's natural texture.",
    },
    {
      title: "Gentle Care",
      description: "Gentle wash and massage your dreads. Style and tie with silk material to avoid straining and cutting your dreads.",
    }
  ];

  return (
    <div className="w-full bg-background">
      {/* Hero Section - Enterprise Minimalism */}
      <section className="relative w-full h-[60vh] md:h-[90vh] overflow-hidden bg-background">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover"
              priority={index === 0}
            />

            <motion.div
              initial={{ opacity: 0, y: 120, x: -100 }}
              animate={{ opacity: 1, y: 120, x: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute left-0"
            >
              <div className="relative z-20 h-full flex items-center">
                <div className="max-w-7xl mx-auto md:pl-8 p-4 w-full">
                  <div className="max-w-xl space-y-6 bg-background/80 backdrop-blur-sm p-6">
                    <Badge variant="outline" className="border-foreground/20 bg-transparent backdrop-blur">
                      {slide.accent}
                    </Badge>
                    <h1 className={`text-3xl font-bold tracking-tight text-foreground ${playfairDisplay.className}`}>
                      {slide.title}
                    </h1>
                    <p className="text-lg text-muted-foreground font-light">
                      {slide.subtitle}
                    </p>
                    <Button
                      size="lg"
                      className="mt-4 group"
                      onClick={() => router.push('/collections/featured')}
                    >
                      {slide.buttonText}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ))}

        {/* Slide Indicators */}
        <div className="absolute bottom-12 left-8 flex gap-2 z-30">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-0.5 transition-all ${index === currentSlide ? 'w-12 bg-background' : 'w-6 bg-background/30'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-px flex-1 bg-border" />
              <Badge variant="outline">Featured Collection</Badge>
              <div className="h-px flex-1 bg-border" />
            </div>
            <h2 className={`text-4xl font-light text-center tracking-tight ${playfairDisplay.className}`}>
              Crown Favorites
            </h2>
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-64 w-full" />
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2 mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="max-w-md mx-auto">
              <AlertDescription>
                Failed to load products. {error}
              </AlertDescription>
            </Alert>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => {
                const imageUrl = Array.isArray(product.images) && product.images.length > 0
                  ? product.images[0]
                  : '/placeholder.jpg';
                const stock = product.inventory_quantity;

                return (
                  <Card
                    key={product.id}
                    className="group cursor-pointer overflow-hidden border-border/50 hover:border-foreground/20 transition-all pt-0"
                    onClick={() => router.push(`/products/${product.slug}`)}
                  >
                    <div className="relative overflow-hidden bg-muted h-64 top-0">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      {stock <= 0 && (
                        <Badge variant="secondary" className="absolute top-4 left-4">
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                    <CardHeader className="space-y-1">
                      <CardTitle className={`text-base font-normal line-clamp-2 ${playfairDisplay.className}`}>
                        {product.name}
                      </CardTitle>
                      <CardDescription className="text-xs tracking-wider">
                        {product.description?.slice(0, 100)}...
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between items-center">
                      <span className="text-lg font-light">
                        KSh {parseFloat(String(product.price)).toFixed(2)}
                      </span>
                      <Button variant="ghost" size="sm" className="gap-2">
                        View <ArrowRight className="h-3 w-3" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Separator />

      {/* Collections Section */}
      <section className="py-24 bg-muted/20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-16">
            <Badge variant="outline" className="mb-3">Collections</Badge>
            <h2 className={`text-4xl font-light tracking-tight mb-2 ${playfairDisplay.className}`}>
              Shop by Category
            </h2>
            <p className="text-muted-foreground font-light">
              Curated selections for every need
            </p>
          </div>

          {collectionsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-80 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {!collectionsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {collections.map((collection) => (
                <Card
                  key={collection.id}
                  className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow pt-0"
                  onClick={() => router.push(`/collections/${collection.slug}`)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={collection.image_url || '/placeholder.jpg'}
                      alt={collection.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className={`text-2xl font-light ${playfairDisplay.className}`}>
                      {collection.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {collection.description || `Explore our ${collection.name} collection`}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <div className="flex justify-between items-center w-full">
                      <Button variant="outline" size="sm">
                        Explore
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Separator />

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-16">
            <Badge variant="outline" className="mb-3">Expert Guidance</Badge>
            <h2 className={`text-4xl font-light tracking-tight ${playfairDisplay.className}`}>
              Natural Hair Care
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-border/50">
                <CardHeader>
                  <CardTitle className={`text-xl font-normal flex items-center gap-2 ${playfairDisplay.className}`}>
                    <Check className="h-5 w-5 text-primary" />
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* About Section */}
      <section className="py-24 bg-muted/20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <Badge variant="outline">Our Story</Badge>
              <h2 className={`text-4xl font-light tracking-tight ${playfairDisplay.className}`}>
                Meet the Creator
              </h2>
              <div className="space-y-4 text-muted-foreground font-light leading-relaxed">
                <p>
                  Welcome to Loc'd Essence – where crowns are nurtured, beauty is celebrated, and community thrives.
                </p>
                <p>
                  This isn't just commerce – it's a reclamation. Every purchase supports Black artisans across Africa and its diaspora, celebrating the rich heritage of natural hair care and handcrafted jewelry.
                </p>
                <p>
                  From premium hair care products formulated for natural textures to stunning jewelry pieces that tell our stories, every item is chosen with intention and crafted with love.
                </p>
              </div>
              <Button
                size="lg"
                variant="outline"
                className="group mt-6"
                onClick={() => router.push('/about')}
              >
                Learn More
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
            <div className="relative aspect-[3/4] lg:aspect-square">
              <Image
                src="/creator.png"
                alt="Founder of Loc'd Essence"
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1594736797933-d0eb8306c9e3?auto=format&fit=crop&w=600&q=80";
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
