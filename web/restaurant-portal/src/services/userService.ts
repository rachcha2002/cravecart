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

class UserService {
  private static instance: UserService;
  private baseUrl =
    process.env.REACT_APP_API_URL || "http://localhost:3001/api";

  private constructor() {
    // Initialize axios with default config
    axios.defaults.baseURL = this.baseUrl;
    this.setupInterceptors();
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  private setupInterceptors() {
    axios.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>("/auth/login", {
      email,
      password,
    });
    return response.data;
  }

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>("/auth/register", data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await axios.get<User>("/auth/me");
    return response.data;
  }
}

export const userService = UserService.getInstance();
