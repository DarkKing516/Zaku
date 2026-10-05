export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiResponseMeta {
  requestId: string;
  timestamp: string;
  path?: string;
  pagination?: PaginationMeta;
}

export interface ApiSuccessResponse<TData> {
  success: true;
  statusCode: number;
  message: string;
  data: TData;
  meta: ApiResponseMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorBody {
  code: string;
  details: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  data: null;
  error: ApiErrorBody;
  errorImage: string;
  meta: ApiResponseMeta;
}

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

export type TenantStatus = 'PROVISIONING' | 'ACTIVE' | 'FAILED' | 'SUSPENDED';

export interface CreateTenantRequest {
  slug: string;
  name: string;
}

export interface TenantResponse {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  tenantId: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: UserResponse;
}
