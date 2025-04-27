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

// Enhanced error handling for API responses
export const handleApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  // First check if the response is ok
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[API] Error response:', {
      status: response.status,
      text: errorText.substring(0, 200)
    });
    
    // Check if we received an HTML error page
    if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
      throw new Error('Connection error: The API server might be unavailable. Please try again.');
    }
    
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.message || `Request failed: ${response.status}`);
    } catch (e) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }
  }

  const contentType = response.headers.get('content-type');
  
  // Handle non-JSON responses
  if (!contentType || !contentType.includes('application/json')) {
    console.error('[API] Unexpected content type:', contentType);
    throw new Error('Invalid response: Expected JSON but received different content type');
  }

  try {
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] JSON parse error:', error);
    throw new Error('Failed to parse server response');
  }
};
