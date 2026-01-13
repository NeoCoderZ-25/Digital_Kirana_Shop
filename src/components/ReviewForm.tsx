import { useState } from 'react';
import { Star, ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted: () => void;
  hasOrdered?: boolean;
}

const ReviewForm = ({ productId, onReviewSubmitted, hasOrdered = false }: ReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 3) {
      toast({ title: 'Maximum 3 images allowed', variant: 'destructive' });
      return;
    }

    const newImages = [...images, ...files].slice(0, 3);
    setImages(newImages);

    // Create previews
    newImages.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => {
          const updated = [...prev];
          updated[index] = e.target?.result as string;
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'Please login to submit a review', variant: 'destructive' });
      return;
    }

    if (rating === 0) {
      toast({ title: 'Please select a rating', variant: 'destructive' });
      return;
    }

    if (comment.trim().length < 10) {
      toast({ title: 'Comment must be at least 10 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      // Create review
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating,
          comment: comment.trim(),
          is_verified_purchase: hasOrdered,
          is_approved: false, // Admin needs to approve
        })
        .select()
        .single();

      if (reviewError) throw reviewError;

      // Upload images if any
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${review.id}-${i}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('review-images')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from('review-images')
            .getPublicUrl(filePath);

          await supabase
            .from('review_images')
            .insert({
              review_id: review.id,
              image_url: urlData.publicUrl,
              display_order: i,
            });
        }
      }

      toast({ title: 'Review submitted!', description: 'Your review will be visible after approval.' });
      setRating(0);
      setComment('');
      setImages([]);
      setImagePreviews([]);
      onReviewSubmitted();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({ title: 'Error', description: 'Failed to submit review', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Please login to write a review
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Write a Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Your Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "w-8 h-8 transition-colors",
                    (hoverRating || rating) >= star
                      ? "fill-accent text-accent"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Your Review</label>
          <Textarea
            placeholder="Share your experience with this product... (min 10 characters)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-1">{comment.length}/500 characters</p>
        </div>

        {/* Image Upload */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Add Photos (optional)</label>
          <div className="flex gap-2 flex-wrap">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative w-20 h-20">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <label className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <ImagePlus className="w-6 h-6 text-muted-foreground" />
              </label>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Up to 3 images</p>
        </div>

        {/* Verified Purchase Badge */}
        {hasOrdered && (
          <div className="flex items-center gap-2 text-sm text-success">
            <span className="w-2 h-2 bg-success rounded-full" />
            Verified Purchase
          </div>
        )}

        {/* Submit Button */}
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Review'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;
