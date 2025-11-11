import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { usersAPI, artsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { ArrowLeft, UserPlus, UserMinus, Image as ImageIcon, Users, Camera, Mail, Edit2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useForm } from 'react-hook-form';

const ArtistProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isProfileImageOpen, setIsProfileImageOpen] = useState(false);
  const [isCoverImageOpen, setIsCoverImageOpen] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [coverImagePreview, setCoverImagePreview] = useState<string>('');
  const [coverImageScale, setCoverImageScale] = useState(1);
  const [coverImageY, setCoverImageY] = useState(0);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);

  const { data: artistData, isLoading: artistLoading } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => usersAPI.getById(id!),
    enabled: !!id,
  });

  const { data: artsData, isLoading: artsLoading } = useQuery({
    queryKey: ['artist-arts', id],
    queryFn: () => artsAPI.getAll({ limit: 100 }),
    enabled: !!id,
    select: (data) => {
      const arts = (data as any)?.data?.data?.arts || [];
      return arts.filter((art: any) => String(art.artist?._id) === String(id));
    },
  });

  const followMutation = useMutation({
    mutationFn: (artistId: string) => usersAPI.follow(artistId),
    onSuccess: () => {
      toast.success('Followed successfully!');
      queryClient.invalidateQueries({ queryKey: ['artist', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to follow');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (artistId: string) => usersAPI.unfollow(artistId),
    onSuccess: () => {
      toast.success('Unfollowed successfully!');
      queryClient.invalidateQueries({ queryKey: ['artist', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unfollow');
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { username?: string; email?: string }) => usersAPI.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['artist', id] });
      setIsProfileEditOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  const updateProfileImageMutation = useMutation({
    mutationFn: (formData: FormData) => usersAPI.updateProfileImage(formData),
    onSuccess: () => {
      toast.success('Profile image updated!');
      queryClient.invalidateQueries({ queryKey: ['artist', id] });
      setIsProfileImageOpen(false);
      setProfileImageFile(null);
      setProfileImagePreview('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile image');
    },
  });

  const updateCoverImageMutation = useMutation({
    mutationFn: (formData: FormData) => usersAPI.updateCoverImage(formData),
    onSuccess: () => {
      toast.success('Cover image updated!');
      queryClient.invalidateQueries({ queryKey: ['artist', id] });
      setIsCoverImageOpen(false);
      setCoverImageFile(null);
      setCoverImagePreview('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update cover image');
    },
  });

  const { register, handleSubmit } = useForm<{ username: string; bio: string }>();

  const artist = (artistData as any)?.data?.data;
  const arts = artsData || [];
  const isOwnProfile = user?._id === id;
  const isFollowing = artist?.followers?.some((f: any) =>
    String(f) === String(user?._id) || String(f._id) === String(user?._id)
  );

  const handleFollowToggle = () => {
    if (!user) {
      toast.error('Please login to follow artists');
      navigate('/login');
      return;
    }
    if (isFollowing) {
      unfollowMutation.mutate(id!);
    } else {
      followMutation.mutate(id!);
    }
  };

  const onProfileSubmit = (values: { username: string; bio: string }) => {
    updateProfileMutation.mutate(values);
  };

  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileImageSubmit = () => {
    if (profileImageFile) {
      const formData = new FormData();
      formData.append('profileImage', profileImageFile);
      updateProfileImageMutation.mutate(formData);
    }
  };

  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      setCoverImageScale(1);
      setCoverImageY(0);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const cropImage = (file: File, scale: number, yOffset: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        const targetWidth = 1200;
        const targetHeight = 400;
        const aspectRatio = targetWidth / targetHeight;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Calculate source dimensions based on scale
        const sourceScaledWidth = img.width * scale;
        const sourceScaledHeight = img.height * scale;

        // Calculate what portion of the scaled image to show
        const visibleWidth = Math.min(sourceScaledWidth, targetWidth);
        const visibleHeight = Math.min(sourceScaledHeight, targetHeight);

        // Calculate source rectangle
        const sourceX = (img.width - visibleWidth / scale) / 2;
        const sourceY = (img.height - visibleHeight / scale) / 2 - (yOffset / scale);
        const sourceWidth = visibleWidth / scale;
        const sourceHeight = visibleHeight / scale;

        ctx.drawImage(
          img,
          Math.max(0, sourceX),
          Math.max(0, sourceY),
          Math.min(sourceWidth, img.width - sourceX),
          Math.min(sourceHeight, img.height - sourceY),
          0,
          0,
          targetWidth,
          targetHeight
        );

        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], file.name, { type: file.type });
            resolve(croppedFile);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, file.type, 0.95);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleCoverImageSubmit = async () => {
    if (coverImageFile) {
      try {
        const croppedFile = await cropImage(coverImageFile, coverImageScale, coverImageY);
        const formData = new FormData();
        formData.append('coverImage', croppedFile);
        updateCoverImageMutation.mutate(formData);
      } catch (error) {
        toast.error('Failed to process image');
      }
    }
  };

  if (artistLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-12 flex-1">
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-32 w-32 rounded-full mb-4" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center flex-1">
          <p>Artist not found</p>
          <Button onClick={() => navigate('/arts')} className="mt-4">
            Back to Gallery
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Cover Image Section */}
        <div className="relative w-full h-64 md:h-80 bg-gradient-to-br from-muted to-muted/50">
          {artist.coverImage?.url ? (
            <img
              src={artist.coverImage.url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-muted/30 via-muted/20 to-muted/10" />
          )}

          {isOwnProfile && (
            <div className="absolute top-4 right-4">
              <Button
                size="sm"
                variant="secondary"
                className="gap-2"
                onClick={() => setIsCoverImageOpen(true)}
              >
                <Camera className="h-4 w-4" />
                Update Cover
              </Button>
            </div>
          )}

          {/* Profile Picture Overlaid */}
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              {artist.profileImage?.url ? (
                <img
                  src={artist.profileImage.url}
                  alt={artist.username}
                  className="w-32 h-32 rounded-full border-4 border-background object-cover shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-background bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                  {artist.username[0].toUpperCase()}
                </div>
              )}

              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setIsProfileImageOpen(true)}
                  className="absolute bottom-0 right-0 p-2 bg-primary rounded-full border-2 border-background shadow-lg hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-4 w-4 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="container mx-auto px-4 pt-20 pb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-bold">{artist.username}</h1>
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsProfileEditOpen(true)}
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
              {artist.bio && (
                <p className="text-muted-foreground mb-3 max-w-2xl">{artist.bio}</p>
              )}
              <p className="text-sm text-muted-foreground mb-3">{artist.email}</p>
              <div className="flex items-center gap-6 text-sm">
                <button
                  onClick={() => setIsFollowersModalOpen(true)}
                  className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
                >
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {artist.followers?.length || 0} Followers
                  </span>
                </button>
                <button
                  onClick={() => setIsFollowingModalOpen(true)}
                  className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
                >
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {artist.following?.length || 0} Following
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {arts.length} Artworks
                  </span>
                </div>
              </div>
            </div>

            {!isOwnProfile && (
              <div className="flex gap-3">
                {user && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={handleFollowToggle}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  variant={user && isFollowing ? 'outline' : 'default'}
                  size="lg"
                  className="gap-2"
                >
                  {user && isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Artist's Artworks */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Gallery</h2>

            {artsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-64 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : arts.length === 0 ? (
              <div className="text-center py-20 bg-muted/30 rounded-xl">
                <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No artworks yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {arts.map((art: any) => (
                  <Card
                    key={art._id}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/arts/${art._id}`)}
                  >
                    <div className="aspect-square overflow-hidden bg-muted rounded-t-xl">
                      {art.images?.[0]?.url && (
                        <img
                          src={art.images[0].url}
                          alt={art.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1 text-center">
                        {art.name}
                      </h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Profile Dialog */}
      <Dialog open={isProfileEditOpen} onOpenChange={setIsProfileEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                defaultValue={artist.username}
                {...register('username')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                defaultValue={artist.bio || ''}
                {...register('bio')}
                placeholder="Tell us about yourself..."
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">Maximum 500 characters</p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProfileEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Profile Image Dialog */}
      <Dialog open={isProfileImageOpen} onOpenChange={(open) => {
        setIsProfileImageOpen(open);
        if (!open) {
          setProfileImageFile(null);
          setProfileImagePreview('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile Image</DialogTitle>
            <DialogDescription>
              Choose a new profile picture
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profileImage">Profile Image</Label>
              <Input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={handleProfileImageSelect}
              />
            </div>
            {profileImagePreview && (
              <div className="relative w-32 h-32 mx-auto">
                <img
                  src={profileImagePreview}
                  alt="Preview"
                  className="w-full h-full rounded-full object-cover border-4 border-border"
                />
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsProfileImageOpen(false);
                  setProfileImageFile(null);
                  setProfileImagePreview('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProfileImageSubmit}
                disabled={updateProfileImageMutation.isPending || !profileImageFile}
              >
                {updateProfileImageMutation.isPending ? 'Uploading...' : 'Update Image'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Cover Image Dialog */}
      <Dialog open={isCoverImageOpen} onOpenChange={(open) => {
        setIsCoverImageOpen(open);
        if (!open) {
          setCoverImageFile(null);
          setCoverImagePreview('');
          setCoverImageScale(1);
          setCoverImageY(0);
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Update Cover Image</DialogTitle>
            <DialogDescription>
              Choose and customize your cover image. Adjust zoom and position to get the perfect framing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image</Label>
              <Input
                id="coverImage"
                type="file"
                accept="image/*"
                onChange={handleCoverImageSelect}
              />
            </div>
            {coverImagePreview && (
              <div className="space-y-4">
                <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border bg-muted">
                  <img
                    src={coverImagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    style={{
                      transform: `scale(${coverImageScale}) translateY(${coverImageY}px)`,
                      transition: 'transform 0.2s',
                    }}
                  />
                </div>

                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="coverScale">
                      Zoom: {(coverImageScale * 100).toFixed(0)}%
                    </Label>
                    <input
                      id="coverScale"
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={coverImageScale}
                      onChange={(e) => setCoverImageScale(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>50%</span>
                      <span>300%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coverY">
                      Vertical Position: {coverImageY > 0 ? `↓ ${coverImageY}px` : coverImageY < 0 ? `↑ ${Math.abs(coverImageY)}px` : 'Center'}
                    </Label>
                    <input
                      id="coverY"
                      type="range"
                      min="-200"
                      max="200"
                      step="10"
                      value={coverImageY}
                      onChange={(e) => setCoverImageY(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>↑ Up</span>
                      <span>↓ Down</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCoverImageOpen(false);
                  setCoverImageFile(null);
                  setCoverImagePreview('');
                  setCoverImageScale(1);
                  setCoverImageY(0);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCoverImageSubmit}
                disabled={updateCoverImageMutation.isPending || !coverImageFile}
              >
                {updateCoverImageMutation.isPending ? 'Uploading...' : 'Update Cover'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Followers Modal */}
      <Dialog open={isFollowersModalOpen} onOpenChange={setIsFollowersModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
            <DialogDescription>
              People following {artist.username}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-3 mt-4">
            {artist.followers && artist.followers.length > 0 ? (
              artist.followers.map((follower: any) => (
                <button
                  key={follower._id || follower}
                  onClick={() => {
                    setIsFollowersModalOpen(false);
                    navigate(`/artist/${follower._id || follower}`);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  {typeof follower === 'object' && follower.profileImage?.url ? (
                    <img
                      src={follower.profileImage.url}
                      alt={follower.username}
                      className="h-12 w-12 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-lg border-2 border-border">
                      {typeof follower === 'object' && follower.username ? follower.username[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">
                      {typeof follower === 'object' ? follower.username : 'Unknown User'}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No followers yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Modal */}
      <Dialog open={isFollowingModalOpen} onOpenChange={setIsFollowingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
            <DialogDescription>
              People {artist.username} is following
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-3 mt-4">
            {artist.following && artist.following.length > 0 ? (
              artist.following.map((following: any) => (
                <button
                  key={following._id || following}
                  onClick={() => {
                    setIsFollowingModalOpen(false);
                    navigate(`/artist/${following._id || following}`);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  {typeof following === 'object' && following.profileImage?.url ? (
                    <img
                      src={following.profileImage.url}
                      alt={following.username}
                      className="h-12 w-12 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-lg border-2 border-border">
                      {typeof following === 'object' && following.username ? following.username[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">
                      {typeof following === 'object' ? following.username : 'Unknown User'}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Not following anyone yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ArtistProfile;
