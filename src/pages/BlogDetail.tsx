import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { blogsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Heart, MessageCircle, Calendar, User as UserIcon, Send, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const BlogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['blog', id],
    queryFn: () => blogsAPI.getById(id!),
    enabled: !!id,
  });

  // Focus comment input if navigated with #comment hash
  useEffect(() => {
    if (location.hash === '#comment' && commentTextareaRef.current && !isLoading) {
      // Small delay to ensure the page is fully rendered
      setTimeout(() => {
        commentTextareaRef.current?.focus();
        // Scroll to comments section smoothly
        const commentsSection = document.getElementById('comments-section');
        if (commentsSection) {
          commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
      // Remove hash from URL after scrolling
      window.history.replaceState(null, '', location.pathname);
    }
  }, [location.hash, isLoading]);

  const likeMutation = useMutation({
    mutationFn: (blogId: string) => blogsAPI.like(blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to like');
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: (blogId: string) => blogsAPI.unlike(blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unlike');
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ blogId, text }: { blogId: string; text: string }) => blogsAPI.comment(blogId, text),
    onSuccess: () => {
      setCommentText('');
      toast.success('Comment added');
      queryClient.invalidateQueries({ queryKey: ['blog', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to comment');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: ({ blogId, commentId }: { blogId: string; commentId: string }) =>
      blogsAPI.deleteComment(blogId, commentId),
    onSuccess: () => {
      toast.success('Comment deleted');
      queryClient.invalidateQueries({ queryKey: ['blog', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    },
  });

  const blog = (data as any)?.data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-12 flex-1">
          <Skeleton className="h-96 w-full mb-6" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center flex-1">
          <p>Blog not found</p>
          <Button onClick={() => navigate('/blogs')} className="mt-4">
            Back to Blogs
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isLiked = blog.likes?.some((likeId: any) =>
    String(likeId) === String(user?._id) || String(likeId._id) === String(user?._id)
  );

  const handleLikeToggle = () => {
    if (!user) {
      toast.error('Please login to like');
      navigate('/login');
      return;
    }
    if (isLiked) {
      unlikeMutation.mutate(blog._id);
    } else {
      likeMutation.mutate(blog._id);
    }
  };

  const handleComment = () => {
    if (!user) {
      toast.error('Please login to comment');
      navigate('/login');
      return;
    }
    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    commentMutation.mutate({ blogId: blog._id, text: commentText });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-12 flex-1">
        <Button
          variant="ghost"
          onClick={() => navigate('/blogs')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blogs
        </Button>

        <article className="max-w-4xl mx-auto">
          {/* Cover Image */}
          {blog.image?.url && (
            <Card className="overflow-hidden border-0 shadow-2xl mb-8">
              <img
                src={blog.image.url}
                alt={blog.title}
                className="w-full h-96 object-cover"
              />
            </Card>
          )}

          {/* Title & Meta */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {blog.title}
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-border">
              <button
                onClick={() => navigate(`/artist/${blog.createdBy?._id}`)}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                  {blog.createdBy?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">Written by</p>
                  <p className="font-semibold">{blog.createdBy?.username || 'Unknown'}</p>
                </div>
              </button>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(blog.createdAt)}
                </div>
                <Button
                  variant={isLiked ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleLikeToggle}
                  disabled={likeMutation.isPending || unlikeMutation.isPending}
                  className="gap-2"
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  {blog.likes?.length || 0}
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {blog.description}
            </p>
          </div>

          {/* Comments Section */}
          <div id="comments-section" className="border-t border-border pt-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Comments ({blog.comments?.length || 0})
            </h2>

            {/* Add Comment */}
            {user && (
              <Card className="p-4 mb-6 bg-muted/30">
                <Textarea
                  ref={commentTextareaRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="mb-3 resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleComment}
                    disabled={commentMutation.isPending || !commentText.trim()}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Post Comment
                  </Button>
                </div>
              </Card>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {blog.comments && blog.comments.length > 0 ? (
                blog.comments.map((comment: any) => (
                  <Card key={comment._id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold flex-shrink-0">
                          {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <button
                              onClick={() => navigate(`/artist/${comment.user?._id}`)}
                              className="font-semibold hover:text-primary transition-colors"
                            >
                              {comment.user?.username || 'Unknown'}
                            </button>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80">{comment.text}</p>
                        </div>
                      </div>
                      {user?._id === comment.user?._id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCommentMutation.mutate({ blogId: blog._id, commentId: comment._id })}
                          disabled={deleteCommentMutation.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default BlogDetail;

