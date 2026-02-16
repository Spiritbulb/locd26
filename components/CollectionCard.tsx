'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Share2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Collection = {
  id: string;
  handle: string;
  title: string;
  description?: string;
  image?: string;
  featuredImage?: {
    url: string;
    altText?: string;
  };
  altText?: string;
  productCount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  updatedAt?: string;
};

type CollectionsCardProps = {
  collection: Collection;
};

export default function CollectionsCard({ collection }: CollectionsCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const collectionUrl = `/collections/${collection.handle}`;

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(`${window.location.origin}${collectionUrl}`);
    const text = encodeURIComponent(`${collection.title} - ${collection.description || 'Shop our collection'}`);

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
      case 'copy':
        navigator.clipboard.writeText(`${window.location.origin}${collectionUrl}`);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="group overflow-hidden border-border/50 hover:border-foreground/20 transition-all pt-0">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {collection.isNew && (
          <Badge variant="secondary" className="bg-foreground text-background">
            New
          </Badge>
        )}
        {collection.isFeatured && (
          <Badge variant="default">
            Featured
          </Badge>
        )}
      </div>

      {/* Image */}
      <Link href={collectionUrl} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={collection.image || collection.featuredImage?.url || '/placeholder-collection.jpg'}
            alt={collection.altText || collection.featuredImage?.altText || collection.title}
            fill
            className={`object-cover transition-transform group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 border-2 border-muted-foreground border-t-transparent animate-spin" />
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />

          {/* Title Overlay */}
          <div className="absolute inset-0 flex items-end p-6">
            <div className="transition-all group-hover:translate-y-0 translate-y-2">
              <h3 className="text-2xl font-light text-white drop-shadow-lg">
                {collection.title}
              </h3>
              {collection.description && (
                <p className="text-white/90 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                  {collection.description}
                </p>
              )}
            </div>
          </div>

          {/* Explore Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="secondary" size="lg">
              Explore Collection
            </Button>
          </div>
        </div>
      </Link>

      {/* Info */}
      <CardHeader className="p-4 lg:hidden">
        <Link href={collectionUrl}>
          <h3 className="font-normal text-base line-clamp-2 hover:text-primary transition-colors">
            {collection.title}
          </h3>
        </Link>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {collection.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {collection.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {collection.productCount !== undefined && (
            <div className="flex items-center gap-2">
              <Package className="h-3 w-3" />
              <span>
                {collection.productCount} {collection.productCount === 1 ? 'Product' : 'Products'}
              </span>
            </div>
          )}

          {collection.updatedAt && (
            <span>
              Updated {new Date(collection.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <Link href={collectionUrl} className="w-full">
          <Button className="w-full">
            Explore Collection
          </Button>
        </Link>

        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={collectionUrl}>
              <Eye className="mr-2 h-3 w-3" />
              Preview
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Share2 className="mr-2 h-3 w-3" />
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleShare('facebook')}>
                Facebook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('twitter')}>
                Twitter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('copy')}>
                Copy Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  );
}