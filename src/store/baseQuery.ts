import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { handleTokenExpiration } from '../utils/tokenValidator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.assamnyay.com';

// Create base query with auth headers
const baseQuery = fetchBaseQuery({
  baseUrl: `${API_BASE_URL}/api`,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('auth_access_token');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('content-type', 'application/json');
    return headers;
  },
});

// Wrapper that handles 401 errors globally
export const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  // Handle 401 Unauthorized - token expired or invalid
  if (result.error && result.error.status === 401) {
    handleTokenExpiration();
  }

  return result;
};
