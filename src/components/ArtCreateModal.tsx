import { useState } from 'react';
import { artsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { Upload, X } from 'lucide-react';

interface ArtCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const ArtCreateModal = ({ open, onOpenChange, onSuccess }: ArtCreateModalProps) => {
  const { register, handleSubmit, formState: { isSubmitting }, setError, watch, reset } = useForm<{ name: string; category: string; price: string; images: FileList }>();
  const [previews, setPreviews] = useState<string[]>([]);
  const images = watch('images');

  const onSubmit = async (values: { name: string; category: string; price: string; images: FileList }) => {
    if (!values.images || values.images.length === 0) {
      setError('images', { type: 'manual', message: 'Please upload at least one image' });
      toast.error('Please upload at least one image');
      return;
    }

    const form = new FormData();
    form.append('name', values.name);
    form.append('category', values.category);
    if (values.price) form.append('price', values.price);
    Array.from(values.images).forEach((file) => form.append('images', file));

    try {
      await artsAPI.create(form);
      toast.success('Art created successfully');
      reset();
      setPreviews([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create art');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPreviews: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === files.length) {
            setPreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePreview = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Art</DialogTitle>
          <DialogDescription>
            Share your artwork with the world. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Art Name *</Label>
            <Input 
              id="name" 
              {...register('name', { required: true, minLength: 2 })} 
              placeholder="Enter a captivating name for your art"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Input 
              id="category" 
              {...register('category', { required: true, minLength: 2 })} 
              placeholder="e.g., Abstract, Portrait, Landscape"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (USD) *</Label>
            <Input 
              id="price" 
              type="number" 
              min="0" 
              step="0.01" 
              {...register('price', { required: true })} 
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Images * (Max 10)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div className="text-sm">
                  <label htmlFor="images" className="text-primary font-medium cursor-pointer hover:underline">
                    Click to upload
                  </label>
                  <span className="text-muted-foreground"> or drag and drop</span>
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB each</p>
              </div>
              <Input 
                id="images" 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden"
                {...register('images')}
                onChange={(e) => {
                  register('images').onChange(e);
                  handleImageChange(e);
                }}
              />
            </div>

            {/* Image Previews */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => removePreview(index)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                reset();
                setPreviews([]);
                onOpenChange(false);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Creating...' : 'Create Art'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ArtCreateModal;

