import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogsAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/Pagination';
import BlogCreateModal from '@/components/BlogCreateModal';
import { Plus, Heart, MessageCircle, User as UserIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const Blogs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pageParam = Number(searchParams.get('page') || '1');
  const tabParam = searchParams.get('tab') || 'feed';
  const limit = 12;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['blogs', { page: pageParam, limit, tab: tabParam }],
    queryFn: () => blogsAPI.getAll({ 
      page: pageParam, 
      limit,
      following: tabParam === 'community' ? 'true' : undefined
    }),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const likeMutation = useMutation({
    mutationFn: (blogId: string) => blogsAPI.like(blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to like');
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: (blogId: string) => blogsAPI.unlike(blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unlike');
    },
  });

  const payload = (data as any)?.data?.data;
  const blogs = payload?.blogs || [];
  const count = payload?.count || 0;
  const totalPages = Math.max(1, Math.ceil(count / limit));

  const handleLikeToggle = (e: React.MouseEvent, blog: any) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to like');
      return;
    }
    const isLiked = blog.likes?.some((likeId: any) => String(likeId) === String(user._id) || String(likeId._id) === String(user._id));
    if (isLiked) {
      unlikeMutation.mutate(blog._id);
    } else {
      likeMutation.mutate(blog._id);
    }
  };

  const handleCommentClick = (e: React.MouseEvent, blogId: string) => {
    e.stopPropagation();
    navigate(`/blogs/${blogId}#comment`);
  };

  const handlePageChange = (nextPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(nextPage));
    setSearchParams(newParams);
  };

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', value);
    newParams.set('page', '1'); // Reset to page 1 when switching tabs
    setSearchParams(newParams);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">ArtScape</h1>
          {user?.role === 'artist' && (
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Write a Blog
            </Button>
          )}
        </div>

        <Tabs value={tabParam} onValueChange={handleTabChange} className="mb-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12">
            <TabsTrigger value="feed" className="text-base">Feed</TabsTrigger>
            <TabsTrigger value="community" className="text-base">
              {user ? 'My Community' : 'Following'}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-48 w-full rounded-lg" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {(Array.isArray(blogs) ? blogs : []).map((blog: any) => (
              <Card
                key={blog._id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/blogs/${blog._id}`)}
              >
                <CardContent className="p-6">
                  {/* Author Header */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/artist/${blog.createdBy?._id}`);
                    }}
                    className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity w-fit"
                  >
                    <div className="relative">
                      {blog.createdBy?.profileImage?.url ? (
                        <img
                          src={blog.createdBy.profileImage.url}
                          alt={blog.createdBy.username}
                          className="h-12 w-12 rounded-full object-cover border-2 border-border"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-lg border-2 border-border">
                          {blog.createdBy?.username?.[0]?.toUpperCase() || 'A'}
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground hover:text-primary transition-colors">
                        {blog.createdBy?.username || 'Unknown Artist'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(blog.createdAt)}
                      </p>
                    </div>
                  </button>

                  {/* Blog Content */}
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold hover:text-primary transition-colors">
                      {blog.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed line-clamp-3">
                      {blog.description}
                    </p>
                  </div>

                  {/* Blog Image */}
                  {blog.image?.url && (
                    <div className="mt-4 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={blog.image.url}
                        alt={blog.title}
                        className="w-full max-h-96 object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  {/* Interaction Bar */}
                  <div className="flex items-center gap-6 mt-6 pt-4 border-t border-border">
                    <button
                      onClick={(e) => handleLikeToggle(e, blog)}
                      disabled={likeMutation.isPending || unlikeMutation.isPending}
                      className={`flex items-center gap-2 transition-colors ${
                        blog.likes?.some((likeId: any) => 
                          String(likeId) === String(user?._id) || String(likeId._id) === String(user?._id)
                        )
                          ? 'text-red-500 hover:text-red-600'
                          : 'text-muted-foreground hover:text-red-500'
                      }`}
                    >
                      <Heart 
                        className={`h-5 w-5 ${
                          blog.likes?.some((likeId: any) => 
                            String(likeId) === String(user?._id) || String(likeId._id) === String(user?._id)
                          )
                            ? 'fill-current'
                            : ''
                        }`} 
                      />
                      <span className="text-sm font-medium">{blog.likes?.length || 0}</span>
                    </button>
                    <button
                      onClick={(e) => handleCommentClick(e, blog._id)}
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">{blog.comments?.length || 0}</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && blogs.length === 0 && (
          <Card className="text-center py-20">
            <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">
              {tabParam === 'community' 
                ? 'No posts from your community yet' 
                : 'No blog posts yet'}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {tabParam === 'community' 
                ? 'Start following artists to see their posts here' 
                : 'Be the first to share your story'}
            </p>
            {user?.role === 'artist' && tabParam === 'feed' && (
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Write a Blog
              </Button>
            )}
          </Card>
        )}

        {!isLoading && totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={pageParam}
              totalPages={totalPages}
              isLoading={isFetching}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </main>

      <BlogCreateModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onSuccess={() => refetch()}
      />

      <Footer />
    </div>
  );
};

export default Blogs;
