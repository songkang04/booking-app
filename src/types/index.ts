export interface Item {
  id: number;
  name: string;
  description: string;
  price: number;
}

export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

