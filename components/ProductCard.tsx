'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Heart, Share2, Star, ShoppingCart, Copy, Facebook, Twitter } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const { addToCart, loading: cartLoading } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite, loading: favoritesLoading } = useFavorites();
  const { notify } = useNotification();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const discount = product.discount ?? 0;
  const originalPrice = discount > 0 ? product.price / (1 - discount / 100) : product.price;
  const productUrl = `/products/${product.slug || product.handle}`;
  const fullProductUrl = typeof window !== 'undefined' ? `${window.location.origin}${productUrl}` : productUrl;

  const handleAddToCart = async () => {
    if (!product.inStock) {
      notify('This item is out of stock', 'error');
      return;
    }

    try {
      await addToCart({
        id: product.id,
        variantId: product.sku || product.id, // Use SKU as variant ID or fall back to product ID
        name: product.title || product.name,
        price: product.price,
        image: product.image || '',
        productId: product.id, // Add productId for cart validation
      });
      notify(`${product.title || product.name} added to cart!`, 'success');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item to cart';
      notify(errorMessage, 'error');
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (isFavorite(product.id)) {
        await removeFromFavorites(product.id);
        notify('Removed from favorites', 'info');
      } else {
        await addToFavorites(product);
        notify('Added to favorites!', 'success');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      notify('Failed to update favorites', 'error');
    }
  };

  const handleShare = (platform: string) => {
    const productName = product.title || product.name;
    const productDescription = product.description || `Check out ${productName}`;
    const url = encodeURIComponent(fullProductUrl);
    const text = encodeURIComponent(`${productName} - ${productDescription}`);

    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(fullProductUrl);
        notify('Product link copied to clipboard!', 'success');
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const isProductFavorite = isFavorite(product.id);

  // Get the first image from the product
  const productImage = product.image ||
    (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null) ||
    '/placeholder-product.jpg';

  return (
    <>
      <Card className="group overflow-hidden border-border/50 hover:border-foreground/20 transition-all pt-0">
        {/* Image */}
        <Link href={productUrl} className="block">
          {/* Badges & Actions */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            {product.isNew && (
              <Badge variant="secondary" className="bg-foreground text-background">
                New
              </Badge>
            )}
            {discount > 0 && (
              <Badge variant="destructive">
                -{discount}%
              </Badge>
            )}
            {product.stock <= 5 && product.stock > 0 && (
              <Badge variant="default">
                Only {product.stock} left
              </Badge>
            )}
            {!product.inStock && (
              <Badge variant="secondary">
                Out of Stock
              </Badge>
            )}
          </div>
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={productImage}
              alt={product.name || product.title || 'Product'}
              fill
              className={`object-cover transition-transform group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 border-2 border-muted-foreground border-t-transparent animate-spin" />
              </div>
            )}

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  setShowQuickView(true);
                }}
                variant="secondary"
              >
                Quick View
              </Button>
            </div>
          </div>
        </Link>

        {/* Info */}
        <CardHeader className="space-y-1 p-4">
          {product.brand && (
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{product.brand}</p>
          )}

          <Link href={productUrl}>
            <h3 className="font-normal text-sm line-clamp-2 hover:text-primary transition-colors">
              {product.name || product.title}
            </h3>
          </Link>

          {product.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < Math.floor(product.rating || 0) ? 'fill-primary text-primary' : 'text-muted'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {product.rating} ({product.reviews || 0})
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4 pt-0 space-y-3 flex flex-row justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-light">{formatPrice(product.price)}</span>
            {discount > 0 && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          <div className="flex flex-row gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleToggleFavorite}
              disabled={favoritesLoading}
              className={isProductFavorite ? 'text-destructive' : ''}
            >
              {favoritesLoading ? (
                <div className="h-4 w-4 border-2 border-muted-foreground border-t-transparent animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 ${isProductFavorite ? 'fill-current' : ''}`} />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleShare('facebook')}>
                  <Facebook className="mr-2 h-4 w-4" />
                  Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('twitter')}>
                  <Twitter className="mr-2 h-4 w-4" />
                  Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('telegram')}>
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  Telegram
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleShare('copy')}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            onClick={handleAddToCart}
            disabled={!product.inStock || cartLoading}
            className="w-full"
          >
            {cartLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent animate-spin mr-2" />
                Adding...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Quick View Dialog */}
      <Dialog open={showQuickView} onOpenChange={setShowQuickView}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light">
              {product.name || product.title}
            </DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative aspect-square overflow-hidden bg-muted">
              <Image
                src={productImage}
                alt={product.name || product.title || 'Product'}
                fill
                className="object-cover"
              />
            </div>

            <div className="space-y-4">
              {product.brand && (
                <p className="text-sm text-muted-foreground uppercase tracking-wider">{product.brand}</p>
              )}

              {product.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(product.rating || 0) ? 'fill-primary text-primary' : 'text-muted'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.rating} ({product.reviews || 0} reviews)
                  </span>
                </div>
              )}

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-light">{formatPrice(product.price)}</span>
                {discount > 0 && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(originalPrice)}
                    </span>
                    <Badge variant="destructive">Save {discount}%</Badge>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 ${product.inStock ? 'bg-green-500' : 'bg-destructive'}`} />
                <span className={`text-sm font-medium ${product.inStock ? 'text-green-600' : 'text-destructive'}`}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
                {product.stock <= 5 && product.stock > 0 && (
                  <span className="text-sm text-primary">- Only {product.stock} left!</span>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description || 'No description available for this product.'}
                </p>
              </div>

              <div className="space-y-2">
                <Button onClick={handleAddToCart} disabled={!product.inStock || cartLoading} className="w-full">
                  {cartLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    product.inStock ? 'Add to Cart' : 'Out of Stock'
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowQuickView(false);
                    window.location.href = productUrl;
                  }}
                >
                  View Full Details
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
