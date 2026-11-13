import axiosClient from './axiosClient';

export const authApi = {
  sendOtp: (email: string) => {
    return axiosClient.post('/auth/send-otp', { email });
  },

  register: (data: {
    name: string;
    email: string;
    pass: string;
    otp: string;
    accountType: string;
    shopName?: string;
  }) => {
    return axiosClient.post('/auth/register', {
      name: data.name,
      email: data.email,
      password: data.pass,
      otp: data.otp,
      accountType: data.accountType,
      shopName: data.shopName,
    });
  },

  login: (data: { email: string; pass: string }) => {
    return axiosClient.post('/auth/login', {
      email: data.email,
      password: data.pass,
    });
  },

  getProfile: () => {
    return axiosClient.get('/auth/profile');
  },
};