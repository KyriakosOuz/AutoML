
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ApiResponse } from "@/types/api"
import { supabase } from "@/integrations/supabase/client"

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

// Ensure we only process JSON, handle errors clearly, and log non-JSON responses
export const handleApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const contentType = response.headers.get('content-type') || '';
  
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
  if (!json.hasOwnProperty('status') || !json.hasOwnProperty('data')) {
    return {
      status: 'success',
      data: json as T
    };
  }
  
  return json as ApiResponse<T>;
};
