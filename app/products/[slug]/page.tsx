'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Playfair_Display } from 'next/font/google';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Star,
  Minus,
  Plus,
  Share2,
  Shield,
  Truck,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { createClient } from '@/lib/client';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  inventory_quantity: number;
  options: Record<string, string>;
  sku: string | null;
  image_url: string | null;
}

interface ProductData {
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
  metadata: {
    tags?: string[];
    productType?: string;
    rating?: number;
    reviews?: number;
    features?: string[];
    descriptionHtml?: string;
  };
  variants?: ProductVariant[];
}


export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const supabase = createClient();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { addToCart, loading: cartLoading } = useCart();

  const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG;

  const fetchProduct = async () => {
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

      // Fetch product by slug
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (productError || !productData) {
        console.error('Product error:', productError);
        setError('Product not found');
        return;
      }

      // Fetch product variants
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productData.id)
        .eq('is_active', true)
        .order('position', { ascending: true });

      const variants = variantsData || []; // Ensure it's always an array

      setProduct({
        ...productData,
        variants: variants // Explicitly set as array
      });

      // Set initial variant or use main product if no variants
      if (variants.length > 0) {
        const firstVariant = variants[0];
        setSelectedVariant(firstVariant);
        setSelectedOptions(firstVariant.options || {});
      } else {
        // Create a default variant from product data
        setSelectedVariant({
          id: productData.id,
          name: 'Default',
          price: productData.price,
          inventory_quantity: productData.inventory_quantity,
          options: {},
          sku: productData.sku,
          image_url: null
        });
      }
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.message || 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  useEffect(() => {
    if (product?.variants && product.variants.length > 0 && Object.keys(selectedOptions).length > 0) {
      const variant = product.variants.find((v) => {
        return Object.entries(selectedOptions).every(([key, value]) => {
          return v.options?.[key] === value;
        });
      });

      if (variant) {
        setSelectedVariant(variant);
      }
    }
  }, [selectedOptions, product]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
    }).format(price);
  };

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || !product) return;

    try {
      await addToCart({
        id: product.id,
        variantId: selectedVariant.id,
        name: product.name,
        price: selectedVariant.price,
        image: product.images[0] || '',
        productId: product.id, // Add this for cart validation
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };


  const nextImage = () => {
    if (product && product.images.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product && product.images.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-background">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground font-light">Loading product details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex justify-center items-center min-h-[60vh]">
            <Alert variant="destructive" className="max-w-md">
              <AlertTitle>Product Not Found</AlertTitle>
              <AlertDescription className="mt-2">
                {error || "The product you're looking for doesn't exist."}
                <Button variant="outline" className="mt-4 w-full" asChild>
                  <Link href="/products">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Products
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  const currentImage = product.images[currentImageIndex];
  const isInStock = selectedVariant && selectedVariant.inventory_quantity > 0;
  const maxQuantity = selectedVariant?.inventory_quantity || 0;
  const tags = product.metadata?.tags || [];
  const rating = product.metadata?.rating || 4;
  const reviews = product.metadata?.reviews || 24;

  // Extract unique option names from variants
  const availableOptions: Record<string, Set<string>> = {};
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    product.variants.forEach(variant => {
      if (variant.options) {
        Object.entries(variant.options).forEach(([key, value]) => {
          if (!availableOptions[key]) {
            availableOptions[key] = new Set();
          }
          availableOptions[key].add(value);
        });
      }
    });
  }

  return (
    <div className="min-h-screen pt-8 bg-background">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Button variant="ghost" className="mb-8 -ml-4" asChild>
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <Card className="overflow-hidden border-border/50 py-0">
              <div className="relative aspect-square bg-muted">
                {currentImage && (
                  <Image
                    src={currentImage}
                    alt={product.name}
                    fill
                    className={`object-cover transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                  />
                )}

                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 border-2 border-muted-foreground border-t-transparent animate-spin" />
                  </div>
                )}

                {product.images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}

                {product.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {product.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-1.5 w-1.5 transition-all ${index === currentImageIndex ? 'bg-primary w-6' : 'bg-primary/30'
                          }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-primary' : 'border-border hover:border-border/80'
                      }`}
                  >
                    <Image
                      src={image}
                      alt={product.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <h1 className={`text-3xl lg:text-4xl font-light tracking-tight ${playfair.className}`}>
              {product.name}
            </h1>

            <div className="flex items-center gap-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-primary fill-primary' : 'text-muted'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{rating.toFixed(1)} ({reviews} reviews)</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-3xl font-light">
                {selectedVariant && formatPrice(selectedVariant.price)}
              </div>
              {product.compare_at_price && product.compare_at_price > (selectedVariant?.price || product.price) && (
                <div className="text-xl text-muted-foreground line-through font-light">
                  {formatPrice(product.compare_at_price)}
                </div>
              )}
            </div>

            {/* Description with Markdown */}
            <div className="prose prose-sm max-w-none">
              {product.metadata?.descriptionHtml ? (
                <div
                  className="text-muted-foreground leading-relaxed font-light prose-p:my-2 prose-headings:font-normal prose-headings:text-foreground prose-ul:my-2 prose-ol:my-2 prose-li:my-1"
                  dangerouslySetInnerHTML={{ __html: product.metadata.descriptionHtml }}
                />
              ) : (
                <div className="text-muted-foreground leading-relaxed font-light prose-p:my-2 prose-headings:font-normal prose-headings:text-foreground prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-xl font-normal mt-4 mb-2" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-lg font-normal mt-3 mb-2" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-base font-normal mt-2 mb-1" {...props} />,
                      p: ({ node, ...props }) => <p className="my-2" {...props} />,
                      ul: ({ node, ...props }) => <ul className="my-2 ml-4 list-disc" {...props} />,
                      ol: ({ node, ...props }) => <ol className="my-2 ml-4 list-decimal" {...props} />,
                      li: ({ node, ...props }) => <li className="my-1" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-medium" {...props} />,
                      em: ({ node, ...props }) => <em className="italic" {...props} />,
                      a: ({ node, ...props }) => <a className="text-primary hover:underline" {...props} />,
                    }}
                  >
                    {product.description || 'No description available for this product.'}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 ${isInStock ? 'bg-green-500' : 'bg-destructive'}`} />
              <span className={`text-sm font-normal ${isInStock ? 'text-green-600' : 'text-destructive'}`}>
                {isInStock ? `In Stock (${selectedVariant?.inventory_quantity} available)` : 'Out of Stock'}
              </span>
            </div>

            {/* Variant Options */}
            {Object.keys(availableOptions).length > 0 && (
              <div className="space-y-4">
                {Object.entries(availableOptions).map(([optionName, values]) => (
                  <div key={optionName}>
                    <label className="text-sm font-normal mb-2 block capitalize">{optionName}:</label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(values).map((value) => (
                        <Button
                          key={value}
                          variant={selectedOptions[optionName] === value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleOptionChange(optionName, value)}
                        >
                          {value}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isInStock && (
              <div className="flex items-center gap-4">
                <label className="text-sm font-normal">Quantity:</label>
                <div className="flex items-center border">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 text-sm font-normal">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={!isInStock || cartLoading}
                className="flex-1"
                size="lg"
              >
                {cartLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <ShoppingCart className="mr-2 h-5 w-5" />
                )}
                {cartLoading ? 'Pushing your order...' : isInStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>


              <Button variant="outline" size="icon" className="h-12 w-12">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Truck className="h-5 w-5 text-primary" />
                <span>Fast Shipping</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Shield className="h-5 w-5 text-primary" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <RefreshCw className="h-5 w-5 text-primary" />
                <span>30-Day Returns</span>
              </div>
            </div>

            {tags.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-normal mb-2">Tags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
