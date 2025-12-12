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
  compact?: boolean;
}

export const ProductCard = ({ product, compact = false }: ProductCardProps) => {
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
    <Card className={cn(
      "group relative overflow-hidden bg-card hover:shadow-lg transition-shadow duration-300 animate-fade-in",
      compact && "min-w-[160px]"
    )}>
      {/* Favorite Button */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
      >
        <Heart
          className={cn(
            'w-4 h-4 transition-all',
            favorite ? 'fill-destructive text-destructive' : 'text-muted-foreground'
          )}
        />
      </button>

      {/* Featured Badge */}
      {product.is_featured && !compact && (
        <Badge className="absolute top-2 left-2 z-10 deal-badge">
          Featured
        </Badge>
      )}

      {/* Product Image */}
      <div className={cn("aspect-square overflow-hidden bg-muted", compact && "h-32")}>
        <img
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <CardContent className={cn("p-3", compact && "p-2")}>
        {/* Category */}
        {product.category && !compact && (
          <p className="text-xs text-muted-foreground mb-1">{product.category.name}</p>
        )}

        {/* Product Name */}
        <h3 className={cn(
          "font-medium text-foreground line-clamp-2 mb-1",
          compact ? "text-xs min-h-[2rem]" : "text-sm min-h-[2.5rem]"
        )}>
          {product.name}
        </h3>

        {/* Rating - hide on compact */}
        {!compact && (
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
        )}

        {/* Variant Selector - hide on compact */}
        {!compact && product.variants && product.variants.length > 1 && (
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
        <div className={cn("flex items-baseline gap-1 mb-2", compact && "flex-wrap")}>
          <span className={cn("font-bold text-foreground", compact ? "text-sm" : "text-lg")}>₹{price}</span>
          <span className={cn("text-muted-foreground line-through", compact ? "text-xs" : "text-sm")}>₹{originalPrice}</span>
          {!compact && <span className="text-xs text-success font-medium">15% off</span>}
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          size={compact ? "sm" : "default"}
          className={cn(
            'w-full transition-all',
            compact && "h-8 text-xs",
            isAdded ? 'bg-success hover:bg-success' : ''
          )}
          disabled={isAdded}
        >
          {isAdded ? (
            <>
              <Check className={cn("mr-1", compact ? "w-3 h-3" : "w-4 h-4")} />
              {compact ? "Added" : "Added"}
            </>
          ) : (
            <>
              <Plus className={cn("mr-1", compact ? "w-3 h-3" : "w-4 h-4")} />
              {compact ? "Add" : "Add to Cart"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
