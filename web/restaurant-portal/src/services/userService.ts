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
    businessHours: {
      open: string;
      close: string;
    };
  };
}

export class UserService {
  private static instance: UserService;
  private baseUrl =
    process.env.REACT_APP_API_URL || "http://localhost:3001/api";
  private axiosInstance;

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

        // If the error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("No token found");

            const response = await this.refreshToken(token);
            localStorage.setItem("token", response.token);

            // Retry the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${response.token}`;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            // If refresh token fails, clear the token and redirect to login
            localStorage.removeItem("token");
            window.location.href = "/login";
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
    const response = await this.axiosInstance.post<{ token: string }>(
      "/auth/refresh-token",
      { token }
    );
    return response.data;
  }
}

export const userService = UserService.getInstance();
