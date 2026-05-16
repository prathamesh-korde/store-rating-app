import api from './axios';

export const getAdminStores = (params) => api.get('/admin/stores', { params });
export const createStore = (data) => api.post('/admin/stores', data);
export const getAllStores = () => api.get('/admin/stores/all');
export const getTopRatedStores = () => api.get('/admin/stores/top-rated');
export const getRecentStores = () => api.get('/admin/stores/recent');
export const getUserStores = (params) => api.get('/stores', { params });
export const getStoreDetail = (id) => api.get(`/stores/${id}`);
