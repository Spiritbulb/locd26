'use client';

import { useEffect, useState } from 'react';
import { Playfair_Display } from 'next/font/google';
import { Search, Loader2, Package, X } from 'lucide-react';
import { createClient } from '@/lib/client';
import CollectionsCard from '@/components/CollectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
  display: 'swap',
});

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  productCount?: number;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
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

  const fetchCollections = async () => {
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

      // Fetch all collections for this store
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (collectionsError) {
        console.error('Collections error:', collectionsError);
        throw collectionsError;
      }

      const fetchedCollections = collectionsData || [];

      if (fetchedCollections.length === 0) {
        setError('No collections available at the moment');
      }

      // Get product counts for each collection
      const collectionsWithCount = await Promise.all(
        fetchedCollections.map(async (collection) => {
          const { count, error: countError } = await supabase
            .from('collection_products')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', collection.id);

          return {
            ...collection,
            productCount: count || 0
          };
        })
      );

      setCollections(collectionsWithCount);
    } catch (err: any) {
      console.error('Error fetching collections:', err);
      setError(err.message || 'Failed to load collections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const filteredCollections = collections
    .filter((collection) => {
      if (!debouncedSearch.trim()) return true;

      const searchLower = debouncedSearch.toLowerCase().trim();
      const name = collection.name?.toLowerCase() || '';
      const description = collection.description?.toLowerCase() || '';

      return name.includes(searchLower) || description.includes(searchLower);
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground font-light">Loading collections...</p>
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
              <Package className="h-5 w-5" />
              <AlertTitle>Unable to Load Collections</AlertTitle>
              <AlertDescription className="mt-2">
                {error}
                <Button
                  onClick={fetchCollections}
                  variant="outline"
                  className="mt-4 w-full"
                >
                  Retry
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
            Our <span className="text-primary">Collections</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8 font-light">
            Explore curated collections of premium hair care, elegant jewelry, and beauty essentials
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search collections..."
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

            {debouncedSearch && (
              <p className="text-sm text-muted-foreground mt-3">
                {filteredCollections.length} {filteredCollections.length === 1 ? 'result' : 'results'} for "{debouncedSearch}"
              </p>
            )}
          </div>
        </div>

        {/* Collections Grid */}
        {filteredCollections.length === 0 ? (
          <div className="text-center py-20">
            <Card className="max-w-md mx-auto border-border/50">
              <CardContent className="pt-12 pb-12">
                <div className="w-20 h-20 bg-muted flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-light mb-3">
                  {debouncedSearch ? 'No Collections Found' : 'No Collections Available'}
                </h3>
                <p className="text-muted-foreground mb-6 font-light">
                  {debouncedSearch
                    ? `We couldn't find any collections matching "${debouncedSearch}".`
                    : 'Check back soon for new collections.'
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
              {filteredCollections.map((collection) => {
                const updatedDate = collection.updated_at ? new Date(collection.updated_at) : null;
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const isNew = updatedDate ? updatedDate > thirtyDaysAgo : false;

                const productCount = collection.productCount || 0;
                const isFeatured = productCount > 10;

                return (
                  <CollectionsCard
                    key={collection.id}
                    collection={{
                      id: collection.id,
                      handle: collection.slug,
                      title: collection.name,
                      description: collection.description || '',
                      image: collection.image_url || '/placeholder-collection.jpg',
                      featuredImage: collection.image_url ? {
                        url: collection.image_url,
                        altText: collection.name
                      } : undefined,
                      altText: collection.name,
                      productCount: productCount,
                      isNew: isNew,
                      isFeatured: isFeatured,
                      updatedAt: collection.updated_at
                    }}
                  />
                );
              })}
            </div>

            {/* Results Summary */}
            <div className="mt-12 text-center">
              <p className="text-muted-foreground text-sm font-light">
                Showing <span className="font-normal text-foreground">{filteredCollections.length}</span> of{' '}
                <span className="font-normal text-foreground">{collections.length}</span> collections
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
