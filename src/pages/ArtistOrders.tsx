import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersAPI } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Package, Mail, User as UserIcon, Calendar, ArrowLeft, MessageCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const ArtistOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'artist') {
      navigate('/arts');
    }
  }, [user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ['artist-orders'],
    queryFn: () => ordersAPI.getMine(),
    enabled: !!user && user.role === 'artist',
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      ordersAPI.updateStatus(orderId, status),
    onSuccess: () => {
      toast.success('Order status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['artist-orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    },
  });

  const orders = (data as any)?.data?.data?.orders || [];

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const openWhatsApp = (phoneNumber: string) => {
    if (!phoneNumber) {
      toast.error('Phone number not available');
      return;
    }
    // Remove all non-numeric characters except +
    const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
    // Ensure it starts with country code (if it starts with +966 or 966, keep it; if it starts with 0, replace with 966)
    let whatsappNumber = cleanedNumber;
    if (whatsappNumber.startsWith('+966')) {
      whatsappNumber = whatsappNumber.substring(1); // Remove + for WhatsApp URL
    } else if (whatsappNumber.startsWith('966')) {
      // Already has country code
    } else if (whatsappNumber.startsWith('0')) {
      whatsappNumber = '966' + whatsappNumber.substring(1); // Replace leading 0 with 966
    } else if (whatsappNumber.startsWith('5')) {
      whatsappNumber = '966' + whatsappNumber; // Add country code for Saudi numbers starting with 5
    } else {
      whatsappNumber = '966' + whatsappNumber; // Add country code by default
    }
    
    const whatsappUrl = `https://wa.me/${whatsappNumber}`;
    window.open(whatsappUrl, '_blank');
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
            Back
          </Button>
          <h1 className="text-4xl font-bold mb-2">My Art Orders</h1>
          <p className="text-muted-foreground">
            Track orders placed for your artworks
          </p>
        </div>

        {isLoading ? (
          <Card className="p-6">
            <Skeleton className="h-64 w-full" />
          </Card>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-xl">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Orders for your artworks will appear here
            </p>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artwork</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow key={order._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-16 h-16 rounded-lg overflow-hidden bg-muted cursor-pointer flex-shrink-0"
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
                          <div>
                            <div 
                              className="font-semibold hover:text-primary transition-colors cursor-pointer"
                              onClick={() => navigate(`/arts/${order.art?._id}`)}
                            >
                              {order.art?.name || 'Unknown Artwork'}
                            </div>
                            {order.art?.category && (
                              <div className="text-sm text-muted-foreground">
                                {order.art.category}
                              </div>
                            )}
                            {order.art?.price && (
                              <div className="text-sm font-medium text-primary">
                                ${order.art.price}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {order.user?.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-medium">{order.user?.username || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground">{order.user?.email || 'N/A'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {order.phoneNumber && (
                            <button
                              onClick={() => openWhatsApp(order.phoneNumber)}
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <MessageCircle className="h-4 w-4" />
                              WhatsApp
                            </button>
                          )}
                          <a 
                            href={`mailto:${order.user?.email}`}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Mail className="h-4 w-4" />
                            Email
                          </a>
                          <button
                            onClick={() => navigate(`/artist/${order.user?._id}`)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            <UserIcon className="h-4 w-4" />
                            Profile
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status || 'pending'}
                          onValueChange={(value) => handleStatusChange(order._id, value)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (order.phoneNumber) {
                                openWhatsApp(order.phoneNumber);
                              } else {
                                toast.error('Phone number not available');
                              }
                            }}
                            disabled={!order.phoneNumber}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Contact
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ArtistOrders;

