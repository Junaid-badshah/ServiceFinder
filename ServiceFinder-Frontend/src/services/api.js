import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export const loginUser = (data) => api.post('/auth/login', data);
export const registerCustomer = (data) => api.post('/auth/register', data);
export const registerProvider = (data) => api.post('/auth/register-provider', data);

export const getProviders = () => api.get('/providers');
export const getProviderById = (id) => api.get(`/providers/${id}`);
export const createProvider = (data) => api.post('/providers', data);
export const updateProvider = (id, data) => api.put(`/providers/${id}`, data);
export const deleteProvider = (id) => api.delete(`/providers/${id}`);
export const getServices = () => api.get('/services');

export const getRequests = () => api.get('/requests');
export const getRequestsByUser = (userId) => api.get(`/requests/user/${userId}`);
export const createRequest = (data) => api.post('/requests', data);
export const updateRequestStatus = (id, status) => api.put(`/requests/${id}/status`, { status });
export const deleteRequest = (id) => api.delete(`/requests/${id}`);

export const getProviderOffers = () => api.get('/offers/provider');
export const acceptOffer = (id, agreedPrice) => api.post(`/offers/${id}/accept`, { agreedPrice });
export const rejectOffer = (id) => api.post(`/offers/${id}/reject`);
export const sendCounterOffer = (id, counterPrice, message) => api.post(`/offers/${id}/counter`, { counterPrice, message });

export const getWallet = () => api.get('/wallet');
export const getWalletTransactions = () => api.get('/wallet/transactions');
export const topUpWallet = (amount) => api.post('/wallet/topup', { amount });

export const getProfile = () => api.get('/profile/me');
export const updateProfile = (data) => api.put('/profile/update', data);
export const updateProfilePicture = (data) => api.put('/profile/picture', data);

export default api;
