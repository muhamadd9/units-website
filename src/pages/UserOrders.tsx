import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersAPI } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Package, Calendar, ArrowLeft, User as UserIcon, Image as ImageIcon, Phone, MapPin, CreditCard } from 'lucide-react';
import Pagination from '@/components/Pagination';
import { useSearchParams } from 'react-router-dom';

const UserOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get('page') || '1');
  const limit = 12;

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['user-orders', { page: pageParam, limit }],
    queryFn: () => ordersAPI.getMyOrders({ page: pageParam, limit }),
    enabled: !!user,
  });

  const payload = (data as any)?.data?.data;
  const orders = payload?.orders || [];
  const count = payload?.count || 0;
  const totalPages = Math.max(1, Math.ceil(count / limit));

  const handlePageChange = (nextPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(nextPage));
    setSearchParams(newParams);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; label: string }> = {
      pending: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Pending' },
      processing: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Processing' },
      completed: { className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Completed' },
      cancelled: { className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Cancelled' },
    };
    
    const config = statusConfig[status] || { className: 'bg-gray-100 text-gray-800', label: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/arts')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Gallery
          </Button>
          <h1 className="text-4xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">
            View all your art orders
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-24 w-24" />
                    <div className="flex-1">
                      <Skeleton className="h-6 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-xl">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start exploring and place your first order!
            </p>
            <Button onClick={() => navigate('/arts')} className="mt-4">
              Browse Art
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-6 mb-8">
              {orders.map((order: any) => (
                <Card key={order._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Art Image */}
                      <div 
                        className="w-full md:w-48 h-48 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/50 cursor-pointer flex-shrink-0"
                        onClick={() => navigate(`/arts/${order.art?._id}`)}
                      >
                        {order.art?.images?.[0]?.url && (
                          <img
                            src={order.art.images[0].url}
                            alt={order.art.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>

                      {/* Order Details */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 
                            className="text-2xl font-bold mb-2 hover:text-primary transition-colors cursor-pointer"
                            onClick={() => navigate(`/arts/${order.art?._id}`)}
                          >
                            {order.art?.name || 'Unknown Artwork'}
                          </h3>
                          <div className="flex flex-wrap gap-3 mb-3">
                            {order.art?.category && (
                              <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg font-medium text-sm">
                                {order.art.category}
                              </span>
                            )}
                            {order.art?.price && (
                              <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-lg font-semibold text-sm">
                                ${order.art.price}
                              </span>
                            )}
                            {getStatusBadge(order.status || 'pending')}
                          </div>
                        </div>

                        {/* Order Details */}
                        <Card className="bg-muted/30">
                          <CardContent className="p-4 space-y-3">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Package className="h-5 w-5 text-primary" />
                              Order Details
                            </h4>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Phone:</span>
                                <span className="font-medium">{order.phoneNumber || 'N/A'}</span>
                                {order.phoneNumberSecondary && (
                                  <span className="text-muted-foreground"> / {order.phoneNumberSecondary}</span>
                                )}
                              </div>
                              
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <span className="text-muted-foreground">Address: </span>
                                  <span className="font-medium">
                                    {order.address?.street || 'N/A'}
                                    {order.address?.city && `, ${order.address.city}`}
                                    {order.address?.zipCode && ` ${order.address.zipCode}`}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Payment:</span>
                                <span className="font-medium">
                                  {order.paymentMethod === 'COD' ? 'Cash on Delivery' :
                                   order.paymentMethod === 'credit_card' ? 'Credit Card' :
                                   order.paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                                   order.paymentMethod || 'N/A'}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Ordered:</span>
                                <span className="font-medium">{formatDate(order.createdAt)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Artist Info */}
                        {order.art?.artist && (
                          <Card className="bg-muted/30">
                            <CardContent className="p-4">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <UserIcon className="h-5 w-5 text-primary" />
                                Artist Information
                              </h4>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold flex-shrink-0">
                                  {order.art.artist.username?.[0]?.toUpperCase() || 'A'}
                                </div>
                                <div>
                                  <button
                                    onClick={() => navigate(`/artist/${order.art.artist._id}`)}
                                    className="font-semibold hover:text-primary transition-colors text-left"
                                  >
                                    {order.art.artist.username || 'Unknown Artist'}
                                  </button>
                                  <p className="text-xs text-muted-foreground">{order.art.artist.email}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  currentPage={pageParam}
                  totalPages={totalPages}
                  isLoading={isFetching}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default UserOrders;

