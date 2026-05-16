import api from './axios';

export const submitRating = (data) => api.post('/ratings', data);
export const updateRating = (id, data) => api.patch(`/ratings/${id}`, data);
export const getOwnerDashboard = () => api.get('/owner/dashboard');
