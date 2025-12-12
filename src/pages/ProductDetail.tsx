import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductVariant } from '@/hooks/useProducts';
import AppLayout from '@/components/layout/AppLayout';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, Heart, Share2, ShoppingCart, Star, Truck, 
  Shield, RotateCcw, Plus, Minus, Check, ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const favorite = product ? isFavorite(product.id) : false;
  const price = product ? product.price + (selectedVariant?.extra_price || 0) : 0;
  const originalPrice = Math.round(price * 1.15);
  const discount = 15;

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          variants:product_variants(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (data) {
        setProduct(data as Product);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }

        // Fetch related products
        const { data: related } = await supabase
          .from('products')
          .select(`*, category:categories(*), variants:product_variants(*)`)
          .eq('category_id', data.category_id)
          .neq('id', id)
          .eq('in_stock', true)
          .limit(6);

        if (related) {
          setRelatedProducts(related as Product[]);
        }
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        variantId: selectedVariant?.id,
        name: product.name,
        variantName: selectedVariant?.name,
        price,
        imageUrl: product.image_url || undefined,
      });
    }

    setIsAdded(true);
    toast({
      title: t('added'),
      description: `${quantity}x ${product.name} added to cart`,
    });
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || '',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="px-4 pt-4 pb-24 max-w-6xl mx-auto">
          <Skeleton className="h-8 w-8 rounded-full mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!product) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <p className="text-muted-foreground mb-4">Product not found</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </AppLayout>
    );
  }

  // Mock multiple images for demo
  const images = [product.image_url, product.image_url, product.image_url].filter(Boolean);

  return (
    <AppLayout>
      <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => toggleFavorite(product.id)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <Heart className={cn("w-5 h-5", favorite && "fill-destructive text-destructive")} />
            </button>
            <button 
              onClick={() => navigate('/cart')}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 pt-4">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden">
                <img
                  src={images[selectedImage] || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.is_featured && (
                  <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                    Featured
                  </Badge>
                )}
                <Badge className="absolute top-4 right-4 bg-success text-success-foreground">
                  {discount}% OFF
                </Badge>
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={cn(
                        "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                        selectedImage === idx ? "border-primary" : "border-transparent"
                      )}
                    >
                      <img src={img || ''} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Category & Name */}
              <div>
                {product.category && (
                  <p className="text-sm text-primary font-medium mb-2">{product.category.name}</p>
                )}
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  {product.name}
                </h1>
                
                {/* Ratings */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-success/10 text-success px-2 py-1 rounded">
                    <span className="font-bold text-sm">4.2</span>
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                  <span className="text-sm text-muted-foreground">1,234 ratings</span>
                </div>
              </div>

              {/* Price */}
              <div className="bg-gradient-to-r from-success/10 to-transparent p-4 rounded-xl">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-foreground">₹{price * quantity}</span>
                  <span className="text-lg text-muted-foreground line-through">₹{originalPrice * quantity}</span>
                  <Badge className="bg-success text-success-foreground">{discount}% off</Badge>
                </div>
                <p className="text-sm text-success mt-1 font-medium">
                  You save ₹{(originalPrice - price) * quantity}!
                </p>
              </div>

              {/* Variants */}
              {product.variants && product.variants.length > 1 && (
                <div>
                  <h3 className="font-semibold mb-3">Select Variant</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={cn(
                          "px-4 py-2 rounded-lg border-2 font-medium transition-all",
                          selectedVariant?.id === variant.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {variant.name}
                        {variant.extra_price > 0 && (
                          <span className="text-xs ml-1">+₹{variant.extra_price}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <h3 className="font-semibold mb-3">Quantity</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-muted transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 hover:bg-muted transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{product.description}</p>
                </div>
              )}

              {/* Features */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center p-3 bg-muted/50 rounded-xl">
                  <Truck className="w-6 h-6 text-primary mb-2" />
                  <span className="text-xs font-medium">Free Delivery</span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-muted/50 rounded-xl">
                  <Shield className="w-6 h-6 text-primary mb-2" />
                  <span className="text-xs font-medium">Secure Pay</span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-muted/50 rounded-xl">
                  <RotateCcw className="w-6 h-6 text-primary mb-2" />
                  <span className="text-xs font-medium">Easy Returns</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="px-4 mt-8">
            <Separator className="mb-8" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Reviews & Ratings</h2>
              <button className="text-primary text-sm font-medium flex items-center gap-1">
                See All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Rating Summary */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-foreground">4.2</div>
                  <div className="flex items-center justify-center gap-1 my-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "w-4 h-4",
                          star <= 4 ? "fill-accent text-accent" : "text-muted"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">1,234 reviews</p>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm w-3">{rating}</span>
                      <Star className="w-3 h-3 fill-accent text-accent" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${[70, 20, 5, 3, 2][5 - rating]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sample Reviews */}
            <div className="space-y-4">
              {[
                { name: "Rahul S.", rating: 5, comment: "Excellent product! Exactly as described. Fast delivery.", date: "2 days ago" },
                { name: "Priya M.", rating: 4, comment: "Good quality, value for money. Would recommend.", date: "1 week ago" },
                { name: "Amit K.", rating: 4, comment: "Nice product. Packaging was great.", date: "2 weeks ago" },
              ].map((review, idx) => (
                <div key={idx} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                        {review.name[0]}
                      </div>
                      <span className="font-medium text-sm">{review.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-3 h-3",
                          i < review.rating ? "fill-accent text-accent" : "text-muted"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="px-4 mt-8">
              <Separator className="mb-8" />
              <h2 className="text-xl font-bold mb-4">Related Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {relatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Bottom CTA */}
        <div className="fixed bottom-16 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border p-4 z-30">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Total Price</p>
              <p className="text-xl font-bold text-foreground">₹{price * quantity}</p>
            </div>
            <Button
              onClick={handleAddToCart}
              size="lg"
              className={cn(
                "flex-1 h-12 text-base font-semibold transition-all",
                isAdded ? "bg-success hover:bg-success" : "bg-gradient-to-r from-primary to-primary/90"
              )}
              disabled={isAdded}
            >
              {isAdded ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProductDetail;
