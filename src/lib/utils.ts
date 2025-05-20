
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ApiResponse } from "@/types/api"
import { supabase } from "@/integrations/supabase/client"
import { API_BASE_URL } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Always uses fresh access token or throws if unauthenticated
export const getAuthHeaders = async () => {
  const { data, error } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  if (!token) {
    console.warn('[AUTH] No access token found. Are you logged in?');
    throw new Error('Unauthorized: Missing access token');
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Enhanced API URL function with logging
export const getWorkingAPIUrl = async (): Promise<string> => {
  console.log("🌍 API base URL resolved to:", API_BASE_URL);
  return API_BASE_URL;
};

// Ensure we only process JSON, handle errors clearly, and log non-JSON responses
export const handleApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const contentType = response.headers.get('content-type') || '';
  
  // More strict content-type check to ensure we only process JSON
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    console.error('[API] Non-JSON response:', text);
    throw new Error('Expected JSON but received non-JSON response');
  }

  const json = await response.json();
  
  if (!response.ok) {
    throw new Error(json.message || 'Request failed');
  }

  // If missing the expected fields, still coerce to ApiResponse
  // This handles inconsistent API responses
  if (!json.hasOwnProperty('status') || !json.hasOwnProperty('data')) {
    return {
      status: 'success',
      data: json as T
    };
  }
  
  return json as ApiResponse<T>;
};
