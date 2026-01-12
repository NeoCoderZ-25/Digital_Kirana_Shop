import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RotateCw, RotateCcw, FlipHorizontal, FlipVertical, Sun, Contrast, Check, X, Crop } from 'lucide-react';

interface ImageEditorProps {
  imageUrl: string;
  open: boolean;
  onClose: () => void;
  onSave: (editedImageDataUrl: string) => void;
}

export const ImageEditor = ({ imageUrl, open, onClose, onSave }: ImageEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
  const [croppedImage, setCroppedImage] = useState<ImageData | null>(null);

  // Load image when URL changes
  useEffect(() => {
    if (imageUrl && open) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setOriginalImage(img);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setBrightness(100);
        setContrast(100);
        setCroppedImage(null);
      };
      img.src = imageUrl;
    }
  }, [imageUrl, open]);

  // Draw image on canvas whenever settings change
  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !originalImage) return;

    // Calculate dimensions
    const maxSize = 400;
    let width = originalImage.width;
    let height = originalImage.height;
    
    if (width > height) {
      if (width > maxSize) {
        height = (height / width) * maxSize;
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width = (width / height) * maxSize;
        height = maxSize;
      }
    }

    // Swap dimensions if rotated 90 or 270 degrees
    const isRotated = rotation === 90 || rotation === 270;
    canvas.width = isRotated ? height : width;
    canvas.height = isRotated ? width : height;

    // Clear and set up transformations
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Move to center for transformations
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Apply flips
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // Draw image centered
    const drawWidth = isRotated ? height : width;
    const drawHeight = isRotated ? width : height;
    ctx.drawImage(originalImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    ctx.restore();

    // Draw crop overlay if cropping
    if (isCropping && cropStart && cropEnd) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const x = Math.min(cropStart.x, cropEnd.x);
      const y = Math.min(cropStart.y, cropEnd.y);
      const w = Math.abs(cropEnd.x - cropStart.x);
      const h = Math.abs(cropEnd.y - cropStart.y);
      
      ctx.clearRect(x, y, w, h);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
    }
  }, [originalImage, rotation, flipH, flipV, brightness, contrast, isCropping, cropStart, cropEnd]);

  useEffect(() => {
    drawImage();
  }, [drawImage]);

  const handleRotateLeft = () => setRotation((r) => (r - 90 + 360) % 360);
  const handleRotateRight = () => setRotation((r) => (r + 90) % 360);
  const handleFlipH = () => setFlipH((f) => !f);
  const handleFlipV = () => setFlipV((f) => !f);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCropStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setCropEnd(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping || !cropStart) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCropEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = () => {
    if (!isCropping || !cropStart || !cropEnd) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const x = Math.min(cropStart.x, cropEnd.x);
    const y = Math.min(cropStart.y, cropEnd.y);
    const w = Math.abs(cropEnd.x - cropStart.x);
    const h = Math.abs(cropEnd.y - cropStart.y);

    if (w > 10 && h > 10) {
      const imageData = ctx.getImageData(x, y, w, h);
      setCroppedImage(imageData);
    }
    
    setIsCropping(false);
    setCropStart(null);
    setCropEnd(null);
  };

  const applyCrop = () => {
    if (!croppedImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = croppedImage.width;
    canvas.height = croppedImage.height;
    ctx.putImageData(croppedImage, 0, 0);
    
    // Create new image from cropped data
    const newImg = new Image();
    newImg.onload = () => {
      setOriginalImage(newImg);
      setCroppedImage(null);
    };
    newImg.src = canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onSave(dataUrl);
    onClose();
  };

  const handleReset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
    setCroppedImage(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Canvas Preview */}
          <div className="flex items-center justify-center bg-muted rounded-lg p-4 min-h-[300px]">
            <canvas
              ref={canvasRef}
              className={`max-w-full max-h-[400px] ${isCropping ? 'cursor-crosshair' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            />
          </div>

          {/* Transform Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRotateLeft} title="Rotate Left">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotateRight} title="Rotate Right">
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button variant={flipH ? 'secondary' : 'outline'} size="sm" onClick={handleFlipH} title="Flip Horizontal">
              <FlipHorizontal className="w-4 h-4" />
            </Button>
            <Button variant={flipV ? 'secondary' : 'outline'} size="sm" onClick={handleFlipV} title="Flip Vertical">
              <FlipVertical className="w-4 h-4" />
            </Button>
            <Button 
              variant={isCropping ? 'secondary' : 'outline'} 
              size="sm" 
              onClick={() => setIsCropping(!isCropping)}
              title="Crop"
            >
              <Crop className="w-4 h-4" />
            </Button>
            {croppedImage && (
              <Button variant="default" size="sm" onClick={applyCrop}>
                Apply Crop
              </Button>
            )}
          </div>

          {/* Adjustment Sliders */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm">Brightness: {brightness}%</Label>
              </div>
              <Slider
                value={[brightness]}
                onValueChange={([val]) => setBrightness(val)}
                min={50}
                max={150}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Contrast className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm">Contrast: {contrast}%</Label>
              </div>
              <Slider
                value={[contrast]}
                onValueChange={([val]) => setContrast(val)}
                min={50}
                max={150}
                step={1}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={handleReset}>
              Reset
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Check className="w-4 h-4 mr-2" />
                Apply Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};