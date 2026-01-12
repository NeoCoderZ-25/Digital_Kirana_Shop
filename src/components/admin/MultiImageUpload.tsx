import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon, Upload, Trash2, Star, Edit2, Loader2, GripVertical, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageEditor } from './ImageEditor';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface ProductImage {
  id?: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  isNew?: boolean;
  file?: File;
}

interface MultiImageUploadProps {
  productId?: string;
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  minImages?: number;
}

export const MultiImageUpload = ({ 
  productId, 
  images, 
  onChange, 
  minImages = 2 
}: MultiImageUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<{ index: number; url: string } | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Load existing images when productId changes
  useEffect(() => {
    if (productId) {
      loadExistingImages();
    }
  }, [productId]);

  const loadExistingImages = async () => {
    if (!productId) return;

    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order');

    if (!error && data) {
      onChange(data.map(img => ({
        id: img.id,
        image_url: img.image_url,
        display_order: img.display_order,
        is_primary: img.is_primary
      })));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: ProductImage[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file
        if (!file.type.startsWith('image/')) {
          toast({ title: 'Invalid file', description: `${file.name} is not an image`, variant: 'destructive' });
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: 'File too large', description: `${file.name} exceeds 5MB`, variant: 'destructive' });
          continue;
        }

        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) {
          toast({ title: 'Upload failed', description: `Failed to upload ${file.name}`, variant: 'destructive' });
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        newImages.push({
          image_url: publicUrl,
          display_order: images.length + newImages.length,
          is_primary: images.length === 0 && newImages.length === 0,
          isNew: true
        });
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
        toast({ title: 'Uploaded', description: `${newImages.length} image(s) uploaded` });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Error', description: 'Failed to upload images', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    // If removed image was primary, set first image as primary
    if (images[index].is_primary && updated.length > 0) {
      updated[0].is_primary = true;
    }
    // Update display orders
    updated.forEach((img, i) => {
      img.display_order = i;
    });
    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      is_primary: i === index
    }));
    onChange(updated);
  };

  const handleEditSave = (editedDataUrl: string) => {
    if (editingImage === null) return;

    // Convert data URL to blob and upload
    fetch(editedDataUrl)
      .then(res => res.blob())
      .then(async (blob) => {
        const fileName = `${Date.now()}-edited.jpg`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, blob, { contentType: 'image/jpeg' });

        if (uploadError) {
          toast({ title: 'Error', description: 'Failed to save edited image', variant: 'destructive' });
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        const updated = [...images];
        updated[editingImage.index] = {
          ...updated[editingImage.index],
          image_url: publicUrl,
          isNew: true
        };
        onChange(updated);
        toast({ title: 'Saved', description: 'Image edited successfully' });
      });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...images];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    
    // Update display orders
    updated.forEach((img, i) => {
      img.display_order = i;
    });
    
    onChange(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const isValid = images.length >= minImages;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Product Images</span>
          <span className="text-sm font-normal text-muted-foreground">
            {images.length} / {minImages} minimum
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Warning */}
        {!isValid && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              At least {minImages} images are required. Add {minImages - images.length} more image(s).
            </AlertDescription>
          </Alert>
        )}

        {/* Image Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id || index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
                image.is_primary ? 'border-primary' : 'border-border'
              } ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              <img
                src={image.image_url}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
              />
              
              {/* Primary Badge */}
              {image.is_primary && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Primary
                </div>
              )}

              {/* Drag Handle */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-background/80 p-1 rounded cursor-grab">
                  <GripVertical className="w-4 h-4" />
                </div>
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.is_primary && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => handleSetPrimary(index)}
                    title="Set as primary"
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={() => setEditingImage({ index, url: image.image_url })}
                  title="Edit image"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8"
                  onClick={() => handleRemoveImage(index)}
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Upload Button */}
          <div
            className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                <span className="text-xs text-muted-foreground">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground">Add Images</span>
              </>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Upload Instructions */}
        <p className="text-xs text-muted-foreground text-center">
          Drag images to reorder. Click the star to set primary image. Max 5MB per image.
        </p>

        {/* Image Editor Dialog */}
        {editingImage && (
          <ImageEditor
            imageUrl={editingImage.url}
            open={true}
            onClose={() => setEditingImage(null)}
            onSave={handleEditSave}
          />
        )}
      </CardContent>
    </Card>
  );
};