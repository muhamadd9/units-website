import { useState } from 'react';
import { blogsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface BlogCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const BlogCreateModal = ({ open, onOpenChange, onSuccess }: BlogCreateModalProps) => {
  const { register, handleSubmit, formState: { isSubmitting }, reset, watch } = useForm<{ title: string; description: string; image: FileList }>();
  const [preview, setPreview] = useState<string>('');
  const image = watch('image');

  const onSubmit = async (values: { title: string; description: string; image: FileList }) => {
    const form = new FormData();
    form.append('title', values.title);
    form.append('description', values.description);
    if (values.image && values.image[0]) {
      form.append('image', values.image[0]);
    }

    try {
      await blogsAPI.create(form);
      toast.success('Blog created successfully');
      reset();
      setPreview('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create blog');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePreview = () => {
    setPreview('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Blog Post</DialogTitle>
          <DialogDescription>
            Share your thoughts, insights, and stories with the community.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input 
              id="title" 
              {...register('title', { required: true, minLength: 2, maxLength: 200 })} 
              placeholder="Enter a captivating title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Content *</Label>
            <Textarea 
              id="description" 
              {...register('description', { required: true, minLength: 2, maxLength: 5000 })} 
              placeholder="Share your story..."
              rows={10}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Cover Image (Optional)</Label>
            {!preview ? (
              <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                <div className="flex flex-col items-center justify-center gap-2 text-center">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div className="text-sm">
                    <label htmlFor="image" className="text-primary font-medium cursor-pointer hover:underline">
                      Click to upload
                    </label>
                    <span className="text-muted-foreground"> or drag and drop</span>
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                </div>
                <Input 
                  id="image" 
                  type="file" 
                  accept="image/*" 
                  className="hidden"
                  {...register('image')}
                  onChange={(e) => {
                    register('image').onChange(e);
                    handleImageChange(e);
                  }}
                />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg border border-border"
                />
                <button
                  type="button"
                  onClick={removePreview}
                  className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                reset();
                setPreview('');
                onOpenChange(false);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Creating...' : 'Publish Blog'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BlogCreateModal;

