import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { artsAPI, ordersAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { ArrowLeft, ShoppingCart, User, Tag } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useForm } from 'react-hook-form';

const ArtDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['art', id],
    queryFn: () => artsAPI.getById(id!),
    enabled: !!id,
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<{
    phoneNumber: string;
    phoneNumberSecondary: string;
    city: string;
    street: string;
  }>({
    defaultValues: {},
  });

  const orderMutation = useMutation({
    mutationFn: (data: {
      artId: string;
      phoneNumber: string;
      phoneNumberSecondary?: string;
      address: { city: string; street: string };
      paymentMethod: string;
    }) => ordersAPI.create(data),
    onSuccess: () => {
      toast.success('Order placed successfully!');
      setIsOrderModalOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      navigate('/my-orders');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to place order');
    },
  });

  const art = data?.data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-96 w-full mb-6" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!art) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p>Art not found</p>
          <Button onClick={() => navigate('/arts')} className="mt-4">
            Back to Gallery
          </Button>
        </div>
      </div>
    );
  }

  const handleOrderClick = () => {
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }
    if (user._id === art.artist?._id) {
      toast.error('You cannot order your own artwork');
      return;
    }
    setIsOrderModalOpen(true);
  };

  const onSubmit = (data: {
    phoneNumber: string;
    phoneNumberSecondary: string;
    city: string;
    street: string;
  }) => {
    orderMutation.mutate({
      artId: art._id,
      phoneNumber: data.phoneNumber,
      phoneNumberSecondary: data.phoneNumberSecondary || undefined,
      address: {
        city: data.city,
        street: data.street,
      },
      paymentMethod: 'COD',
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-12 flex-1">
        <Button
          variant="ghost"
          onClick={() => navigate('/arts')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Gallery
        </Button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {art.images?.map((image: any, index: number) => (
              <Card key={index} className="overflow-hidden border-0 shadow-2xl">
                <img
                  src={image?.url || image}
                  alt={`${art.name} ${index + 1}`}
                  className="w-full h-auto object-cover"
                />
              </Card>
            ))}
          </div>

          {/* Art Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                {art.name}
              </h1>

              {/* Artist Info */}
              <button
                onClick={() => navigate(`/artist/${art.artist?._id}`)}
                className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors mb-6 w-full"
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                  {art.artist?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">Artist</p>
                  <p className="font-semibold">{art.artist?.username || 'Unknown Artist'}</p>
                </div>
                <User className="h-5 w-5 ml-auto text-muted-foreground" />
              </button>

              {/* Category & Price */}
              <div className="flex gap-4 mb-6">
                {art.category && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{art.category}</span>
                  </div>
                )}
                {art.price && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-lg">
                    <span className="text-2xl font-bold text-secondary">${art.price}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Card */}
            <Card className="p-6 bg-gradient-to-br from-muted via-muted/80 to-muted/60 border-2">
              <h3 className="font-semibold text-xl mb-2">Interested in this piece?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Place an order and the artist will get in touch with you directly to finalize the details.
              </p>
              <Button
                onClick={handleOrderClick}
                disabled={user?._id === art.artist?._id}
                size="lg"
                className="w-full gap-2 shadow-lg"
              >
                <ShoppingCart className="h-5 w-5" />
                Place Order
              </Button>
              {user?._id === art.artist?._id && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  You cannot order your own artwork
                </p>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Order Modal */}
      <Dialog open={isOrderModalOpen} onOpenChange={(open) => {
        setIsOrderModalOpen(open);
        if (!open) {
          reset();
          setSelectedCity('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Place Order</DialogTitle>
            <DialogDescription>
              Fill in your contact information and delivery address to place your order.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                placeholder="e.g., +966501234567"
                {...register('phoneNumber', { required: 'Phone number is required' })}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
              )}
            </div>

            {/* Secondary Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumberSecondary">Secondary Phone Number (Optional)</Label>
              <Input
                id="phoneNumberSecondary"
                placeholder="e.g., +966501234567"
                {...register('phoneNumberSecondary')}
              />
            </div>

            {/* Address */}
            <div className="space-y-4">
              <Label>Delivery Address *</Label>
              
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                {selectedCity === 'Other' ? (
                  <Input
                    id="city"
                    placeholder="Enter city name"
                    {...register('city', { required: 'City is required' })}
                  />
                ) : (
                  <select
                    id="city"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register('city', { required: 'City is required' })}
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      register('city').onChange(e);
                    }}
                  >
                    <option value="">Select a city</option>
                    <option value="Riyadh">Riyadh</option>
                    <option value="Jeddah">Jeddah</option>
                    <option value="Mecca">Mecca</option>
                    <option value="Medina">Medina</option>
                    <option value="Dammam">Dammam</option>
                    <option value="Khobar">Khobar</option>
                    <option value="Dhahran">Dhahran</option>
                    <option value="Abha">Abha</option>
                    <option value="Taif">Taif</option>
                    <option value="Tabuk">Tabuk</option>
                    <option value="Buraidah">Buraidah</option>
                    <option value="Khamis Mushait">Khamis Mushait</option>
                    <option value="Hail">Hail</option>
                    <option value="Najran">Najran</option>
                    <option value="Jazan">Jazan</option>
                    <option value="Yanbu">Yanbu</option>
                    <option value="Al Jubail">Al Jubail</option>
                    <option value="Other">Other</option>
                  </select>
                )}
                {selectedCity === 'Other' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setSelectedCity('');
                    }}
                  >
                    ← Back to city list
                  </Button>
                )}
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  placeholder="e.g., King Fahd Road, Building 123, Apartment 45"
                  {...register('street', { required: 'Street address is required' })}
                />
                {errors.street && (
                  <p className="text-sm text-destructive">{errors.street.message}</p>
                )}
              </div>

            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Input
                id="paymentMethod"
                value="Cash on Delivery (COD)"
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Payment will be collected upon delivery</p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOrderModalOpen(false);
                  reset();
                }}
                disabled={orderMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={orderMutation.isPending}>
                {orderMutation.isPending ? 'Placing Order...' : 'Place Order'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ArtDetail;
