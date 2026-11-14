import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    pass: string;
    accountType?: string;
    shopName?: string;
  }) =>
    axios.post(`${API_URL}/auth/register`, {
      name: data.name,
      email: data.email,
      password: data.pass,
      accountType: data.accountType,
      shopName: data.shopName,
    }),

  login: (data: { email: string; pass: string }) =>
    axios.post(`${API_URL}/auth/login`, {
      email: data.email,
      password: data.pass,
    }),

  getProfile: () =>
    axios.get(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    }),
};
