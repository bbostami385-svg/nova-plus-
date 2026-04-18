import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class APIService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          await AsyncStorage.removeItem('authToken');
          // Trigger logout
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.axiosInstance.post('/auth/login', { email, password });
  }

  async register(email: string, password: string, username: string) {
    return this.axiosInstance.post('/auth/register', {
      email,
      password,
      username,
    });
  }

  async logout() {
    return this.axiosInstance.post('/auth/logout');
  }

  // Feed endpoints
  async getFeed(page: number = 1, limit: number = 20) {
    return this.axiosInstance.get('/posts', {
      params: { page, limit },
    });
  }

  async createPost(data: FormData) {
    return this.axiosInstance.post('/posts/create', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async likePost(postId: string) {
    return this.axiosInstance.post(`/posts/${postId}/like`);
  }

  async unlikePost(postId: string) {
    return this.axiosInstance.post(`/posts/${postId}/unlike`);
  }

  async commentPost(postId: string, comment: string) {
    return this.axiosInstance.post(`/posts/${postId}/comments`, { comment });
  }

  // User endpoints
  async getUserProfile(userId: string) {
    return this.axiosInstance.get(`/users/${userId}`);
  }

  async updateProfile(data: any) {
    return this.axiosInstance.put('/users/profile', data);
  }

  async followUser(userId: string) {
    return this.axiosInstance.post(`/users/${userId}/follow`);
  }

  async unfollowUser(userId: string) {
    return this.axiosInstance.post(`/users/${userId}/unfollow`);
  }

  async getFollowers(userId: string, page: number = 1) {
    return this.axiosInstance.get(`/users/${userId}/followers`, {
      params: { page },
    });
  }

  async getFollowing(userId: string, page: number = 1) {
    return this.axiosInstance.get(`/users/${userId}/following`, {
      params: { page },
    });
  }

  // Messages endpoints
  async getConversations(page: number = 1) {
    return this.axiosInstance.get('/messages/conversations', {
      params: { page },
    });
  }

  async getMessages(conversationId: string, page: number = 1) {
    return this.axiosInstance.get(`/messages/${conversationId}`, {
      params: { page },
    });
  }

  async sendMessage(conversationId: string, content: string, mediaUrl?: string) {
    return this.axiosInstance.post(`/messages/${conversationId}`, {
      content,
      mediaUrl,
    });
  }

  // Notifications endpoints
  async getNotifications(page: number = 1) {
    return this.axiosInstance.get('/notifications', {
      params: { page },
    });
  }

  async markNotificationAsRead(notificationId: string) {
    return this.axiosInstance.put(`/notifications/${notificationId}/read`);
  }

  async markAllNotificationsAsRead() {
    return this.axiosInstance.put('/notifications/read-all');
  }

  // Search endpoints
  async searchUsers(query: string, page: number = 1) {
    return this.axiosInstance.get('/users/search', {
      params: { q: query, page },
    });
  }

  async searchPosts(query: string, page: number = 1) {
    return this.axiosInstance.get('/posts/search', {
      params: { q: query, page },
    });
  }

  // Privacy endpoints
  async blockUser(userId: string) {
    return this.axiosInstance.post(`/privacy/block/${userId}`);
  }

  async unblockUser(userId: string) {
    return this.axiosInstance.post(`/privacy/unblock/${userId}`);
  }

  async getBlockedUsers() {
    return this.axiosInstance.get('/privacy/blocked-users');
  }

  // Marketplace endpoints
  async getProducts(page: number = 1, category?: string) {
    return this.axiosInstance.get('/marketplace/products', {
      params: { page, category },
    });
  }

  async getProductDetails(productId: string) {
    return this.axiosInstance.get(`/marketplace/products/${productId}`);
  }

  async createOrder(items: any[], shippingAddress: any) {
    return this.axiosInstance.post('/marketplace/orders/create', {
      items,
      shippingAddress,
    });
  }

  // Creator Fund endpoints
  async getCreatorFund() {
    return this.axiosInstance.get('/creator-fund/details');
  }

  async getEarningsReport() {
    return this.axiosInstance.get('/creator-fund/earnings-report');
  }

  async requestPayout(amount: number) {
    return this.axiosInstance.post('/creator-fund/request-payout', { amount });
  }
}

export default new APIService();
