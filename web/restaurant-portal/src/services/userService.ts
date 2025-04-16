import axios from "axios";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phoneNumber: string;
  restaurantInfo?: {
    restaurantName: string;
    cuisine: string[];
    businessHours: {
      open: string;
      close: string;
    };
  };
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: string;
  restaurantInfo: {
    restaurantName: string;
    cuisine: string[];
    description: string;
    businessHours: {
      open: string;
      close: string;
    };
    images: { url: string; description: string }[];
  };
}

export class UserService {
  private static instance: UserService;
  private baseUrl =
    process.env.REACT_APP_API_URL || "http://localhost:3001/api";
  private axiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  // Add new subscriber to token refresh
  private onTokenRefreshed(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  // Notify all subscribers that the token has been refreshed
  private notifySubscribersAboutTokenRefresh(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors for token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, wait and retry with new token
            return new Promise((resolve) => {
              this.onTokenRefreshed((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.axiosInstance(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const token = localStorage.getItem("token");
            if (!token) {
              throw new Error("No token found");
            }

            const response = await this.refreshToken(token);
            const newToken = response.token;
            localStorage.setItem("token", newToken);

            // Update the authorization header
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Notify all pending requests that token has been refreshed
            this.notifySubscribersAboutTokenRefresh(newToken);

            this.isRefreshing = false;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.isRefreshing = false;
            localStorage.removeItem("token");

            // Don't automatically redirect - just reject the promise
            // The auth context will handle the redirection
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.axiosInstance.post<LoginResponse>(
      "/auth/login",
      {
        email,
        password,
      }
    );
    return response.data;
  }

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await this.axiosInstance.post<LoginResponse>(
      "/auth/register",
      data
    );
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.axiosInstance.get<User>("/auth/me");
    return response.data;
  }

  async refreshToken(token: string): Promise<{ token: string }> {
    try {
      const response = await this.axiosInstance.post<{ token: string }>(
        "/auth/refresh-token",
        { token }
      );
      return response.data;
    } catch (error) {
      // If the refresh token endpoint fails, try a silent fallback to getCurrentUser
      // This can help with backends that don't have a dedicated refresh endpoint
      try {
        await this.getCurrentUser();
        // If the getCurrentUser succeeds with the current token, it's still valid
        return { token };
      } catch {
        throw error;
      }
    }
  }
}

export const userService = UserService.getInstance();
