"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface CategoryCardProps {
  product: {
    id: string;
    name: string;
    title: string;
    handle: string;
    image: string;
    altText?: string;
    description: string;
    price?: number;
    slug: string;
    category: string;
  };
}

export default function CategoryCard({ product }: CategoryCardProps) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleCategoryClick = () => {
    router.push(`/collections/${product.handle || product.slug}`);
  };

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return '';
    return `From KSh ${price.toLocaleString()}`;
  };

  return (
    <Card
      className="group relative overflow-hidden border-border/50 hover:border-foreground/20 transition-all cursor-pointer h-80"
      onClick={handleCategoryClick}
    >
      <div className="relative h-full">
        <Image
          src={product.image}
          alt={product.altText || product.name || product.title}
          fill
          className={`object-cover transition-transform group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            (e.target as any).src = "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80";
          }}
        />

        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="h-8 w-8 border-2 border-muted-foreground border-t-transparent animate-spin" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
          <h3 className="text-2xl font-light mb-2">
            {product.title || product.name}
          </h3>
          <p className="text-white/90 text-sm mb-2 line-clamp-2 font-light">
            {product.description}
          </p>
          {product.price && product.price > 0 && (
            <p className="text-white/80 text-xs mb-4 font-light">
              {formatPrice(product.price)}
            </p>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="self-start bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm text-white"
            onClick={(e) => {
              e.stopPropagation();
              handleCategoryClick();
            }}
          >
            Explore {product.category}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}