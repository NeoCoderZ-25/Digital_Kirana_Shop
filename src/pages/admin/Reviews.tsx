import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Star, 
  Check, 
  X, 
  Trash2, 
  MessageSquare,
  ShieldCheck,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  product: { name: string; image_url: string | null } | null;
  profile: { username: string; email: string } | null;
  images: { id: string; image_url: string }[];
}

const AdminReviews = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [deleteReview, setDeleteReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          product:products(name, image_url),
          images:review_images(id, image_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const reviewsWithProfiles = await Promise.all((data || []).map(async (review) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, email')
          .eq('user_id', review.user_id)
          .maybeSingle();
        return { ...review, profile };
      }));

      setReviews(reviewsWithProfiles);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({ title: 'Error', description: 'Failed to load reviews', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (review: Review) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: true })
        .eq('id', review.id);

      if (error) throw error;

      setReviews(prev => prev.map(r => 
        r.id === review.id ? { ...r, is_approved: true } : r
      ));
      toast({ title: 'Review approved' });
    } catch (error) {
      console.error('Error approving review:', error);
      toast({ title: 'Error', description: 'Failed to approve review', variant: 'destructive' });
    }
  };

  const handleReject = async (review: Review) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: false })
        .eq('id', review.id);

      if (error) throw error;

      setReviews(prev => prev.map(r => 
        r.id === review.id ? { ...r, is_approved: false } : r
      ));
      toast({ title: 'Review rejected' });
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast({ title: 'Error', description: 'Failed to reject review', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteReview) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', deleteReview.id);

      if (error) throw error;

      setReviews(prev => prev.filter(r => r.id !== deleteReview.id));
      toast({ title: 'Review deleted' });
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({ title: 'Error', description: 'Failed to delete review', variant: 'destructive' });
    } finally {
      setDeleteReview(null);
    }
  };

  const pendingReviews = reviews.filter(r => !r.is_approved);
  const approvedReviews = reviews.filter(r => r.is_approved);

  const renderReviewCard = (review: Review) => (
    <Card key={review.id}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img
              src={review.product?.image_url || '/placeholder.svg'}
              alt={review.product?.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-medium text-foreground">{review.product?.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    by {review.profile?.username || 'Unknown'}
                  </span>
                  {review.is_verified_purchase && (
                    <Badge variant="secondary" className="text-xs">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i < review.rating ? "fill-accent text-accent" : "text-muted"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Comment */}
            <p className="text-sm text-muted-foreground mb-3">{review.comment}</p>

            {/* Images */}
            {review.images.length > 0 && (
              <div className="flex gap-2 mb-3">
                {review.images.map((img) => (
                  <div key={img.id} className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.created_at), 'PPP')}
              </span>
              <div className="flex gap-2">
                {!review.is_approved && (
                  <Button size="sm" onClick={() => handleApprove(review)}>
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                )}
                {review.is_approved && (
                  <Button size="sm" variant="outline" onClick={() => handleReject(review)}>
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-destructive"
                  onClick={() => setDeleteReview(review)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
          <p className="text-muted-foreground">Moderate customer reviews</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-8 h-8 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{pendingReviews.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Check className="w-8 h-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-foreground">{approvedReviews.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{reviews.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">
              Pending
              {pendingReviews.length > 0 && (
                <Badge className="ml-2" variant="secondary">{pendingReviews.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="all">All Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-4">
            {pendingReviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Check className="w-12 h-12 text-success mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending reviews</p>
                </CardContent>
              </Card>
            ) : (
              pendingReviews.map(renderReviewCard)
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4 mt-4">
            {approvedReviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No approved reviews</p>
                </CardContent>
              </Card>
            ) : (
              approvedReviews.map(renderReviewCard)
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-4">
            {reviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reviews yet</p>
                </CardContent>
              </Card>
            ) : (
              reviews.map(renderReviewCard)
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteReview} onOpenChange={() => setDeleteReview(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminReviews;
