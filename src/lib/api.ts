import axios from 'axios';

const BASE_URL = 'http://localhost:3400';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('artscape_token');
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  signup: (data: { fullName: string; email: string; password: string; role?: 'admin' | 'user'; confirmPassword?: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/user/me'),
};

// Arts API
export const artsAPI = {
  getAll: (params?: { page?: number; limit?: number; sort?: string }) =>
    api.get('/art', { params }),
  getById: (id: string) => api.get(`/art/${id}`),
  create: (formData: FormData) =>
    api.post('/art', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, formData: FormData) =>
    api.patch(`/art/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(`/art/${id}`),
};

// Orders API
export const ordersAPI = {
  create: (data: {
    artId: string;
    phoneNumber: string;
    phoneNumberSecondary?: string;
    address: { city: string; street: string; zipCode?: string };
    paymentMethod?: string;
  }) => api.post('/order', data),
  getMine: (params?: { page?: number; limit?: number }) =>
    api.get('/order/mine', { params }),
  getMyOrders: (params?: { page?: number; limit?: number }) =>
    api.get('/order/my-orders', { params }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/order/${id}/status`, { status }),
};

// Blogs API
export const blogsAPI = {
  getAll: (params?: { page?: number; limit?: number; sort?: string; following?: string }) =>
    api.get('/blog', { params }),
  getById: (id: string) => api.get(`/blog/${id}`),
  create: (formData: FormData) =>
    api.post('/blog', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, formData: FormData) =>
    api.patch(`/blog/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(`/blog/${id}`),
  like: (id: string) => api.post(`/blog/${id}/like`),
  unlike: (id: string) => api.post(`/blog/${id}/unlike`),
  comment: (id: string, text: string) =>
    api.post(`/blog/${id}/comment`, { text }),
  deleteComment: (id: string, commentId: string) =>
    api.delete(`/blog/${id}/comment`, { data: { commentId } }),
};

// Users API
export const usersAPI = {
  getMe: () => api.get('/user/me'),
  updateProfile: (data: { fullName?: string }) => api.patch('/user/me/profile', data),
};

// Company One Units API
export const companyOneUnitsAPI = {
  create: (data: { unit: string; building: 'A' | 'B' | 'C' | 'D' | 'E'; area: number; bedrooms: number; price: number; view: string; orientation: string; status?: 'available' | 'booked' | 'sold' | 'mokp' | 'hold' }) =>
    api.post('/units/company-one', data),
  update: (id: string, data: Partial<{ unit: string; building: string; area: number; bedrooms: number; price: number; view: string; orientation: string; status: string }>) =>
    api.patch(`/units/company-one/${id}`, data),
  delete: (id: string) => api.delete(`/units/company-one/${id}`),
  getAll: (params?: Record<string, any>) => api.get('/units/company-one', { params }),
  getById: (id: string) => api.get(`/units/company-one/${id}`),
  getMeta: () => api.get('/units/company-one/meta/list'),
};

// Company Two Units API
export const companyTwoUnitsAPI = {
  create: (data: { view: string; orientation: string; totalPrice: number; totalArea: number; balcony: number; netArea: number; modelCode: string; unit: string; building: string; floor: number; status?: 'available' | 'booked' | 'sold' | 'mokp' | 'hold' }) =>
    api.post('/units/company-two', data),
  update: (id: string, data: Partial<{ view: string; orientation: string; totalPrice: number; totalArea: number; balcony: number; netArea: number; modelCode: string; unit: string; building: string; floor: number; status: string }>) =>
    api.patch(`/units/company-two/${id}`, data),
  delete: (id: string) => api.delete(`/units/company-two/${id}`),
  getAll: (params?: Record<string, any>) => api.get('/units/company-two', { params }),
  getById: (id: string) => api.get(`/units/company-two/${id}`),
  getMeta: () => api.get('/units/company-two/meta/list'),
};

// Bookings API
export const bookingsAPI = {
  create: (data: { clientName: string; email: string; phone: string; paymentMethod: 'cash' | 'installments' | 'transfer' | 'other'; unitModel: 'CompanyOneUnit' | 'CompanyTwoUnit'; unit: string; status?: 'available' | 'booked' | 'sold' | 'mokp' | 'hold' }) =>
    api.post('/bookings', data),
  getAll: (params?: Record<string, any>) => api.get('/bookings', { params }),
  exportSelected: (ids: string[]) =>
    api.get('/bookings/export', { params: { ids: ids.join(',') }, responseType: 'blob' }),
  exportAll: () =>
    api.get('/bookings/export/all', { responseType: 'blob' }),
};
