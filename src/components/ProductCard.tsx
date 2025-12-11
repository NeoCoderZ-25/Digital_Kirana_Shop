import { useState } from 'react';
import { Heart, Plus, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { Product, ProductVariant } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [isAdded, setIsAdded] = useState(false);

  const favorite = isFavorite(product.id);
  const price = product.price + (selectedVariant?.extra_price || 0);
  const originalPrice = Math.round(price * 1.15); // Show 15% discount

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      variantName: selectedVariant?.name,
      price,
      imageUrl: product.image_url || undefined,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  return (
    <Card className="group relative overflow-hidden bg-card hover:shadow-lg transition-shadow duration-300 animate-fade-in">
      {/* Favorite Button */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
      >
        <Heart
          className={cn(
            'w-4 h-4 transition-all',
            favorite ? 'fill-destructive text-destructive animate-heart' : 'text-muted-foreground'
          )}
        />
      </button>

      {/* Featured Badge */}
      {product.is_featured && (
        <Badge className="absolute top-2 left-2 z-10 deal-badge">
          Featured
        </Badge>
      )}

      {/* Product Image */}
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <CardContent className="p-3">
        {/* Category */}
        {product.category && (
          <p className="text-xs text-muted-foreground mb-1">{product.category.name}</p>
        )}

        {/* Product Name */}
        <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-1 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Rating Placeholder */}
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                'w-3 h-3',
                i < 4 ? 'fill-accent text-accent' : 'text-muted'
              )}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">(4.0)</span>
        </div>

        {/* Variant Selector */}
        {product.variants && product.variants.length > 1 && (
          <Select
            value={selectedVariant?.id}
            onValueChange={(value) => {
              const variant = product.variants?.find(v => v.id === value);
              setSelectedVariant(variant || null);
            }}
          >
            <SelectTrigger className="h-8 text-xs mb-2">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {product.variants.map((variant) => (
                <SelectItem key={variant.id} value={variant.id} className="text-xs">
                  {variant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-lg font-bold text-foreground">₹{price}</span>
          <span className="text-sm text-muted-foreground line-through">₹{originalPrice}</span>
          <span className="text-xs text-success font-medium">15% off</span>
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          className={cn(
            'w-full h-9 transition-all',
            isAdded ? 'bg-success hover:bg-success' : ''
          )}
          disabled={isAdded}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4 mr-1 animate-checkmark" />
              Added
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-1" />
              Add to Cart
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
