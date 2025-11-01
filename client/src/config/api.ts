import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  signup: async (email: string, password: string) => {
    const { data } = await api.post('/auth/signup', { email, password });
    localStorage.setItem('token', data.token);
    return data;
  },

  signin: async (email: string, password: string) => {
    const { data } = await api.post('/auth/signin', { email, password });
    localStorage.setItem('token', data.token);
    return data;
  },

  signout: async () => {
    await api.post('/auth/signout');
    localStorage.removeItem('token');
  },

  getCurrentUser: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

export const canvasApi = {
  getById: async (id: string) => {
    const { data } = await api.get(`/canvases/${id}`); 
    return data.canvas;
  },

  create: async (drawing_name: string) => {
    const { data } = await api.post('/canvases', { drawing_name }); 
    return data.canvas;
  },

  update: async (id: string, snapshot: any, drawing_name?: string) => { 
    const { data } = await api.patch(`/canvases/${id}`, { snapshot, drawing_name }); 
    return data.canvas;
  },

  delete: async (id: string) => {
    await api.delete(`/canvases/${id}`); 
  },
};