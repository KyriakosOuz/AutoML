
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

// Enhanced API response handler with better error handling and flexibility
export const handleApiResponse = async <T>(response: Response): Promise<ApiResponse<T> & any> => {
  // Check if the response is successful
  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    
    // Try to parse error details
    if (contentType.includes('application/json')) {
      const errorJson = await response.json();
      throw new Error(errorJson.message || errorJson.detail || `Request failed: ${response.status} ${response.statusText}`);
    } else {
      const text = await response.text();
      throw new Error(`Request failed: ${response.status} ${response.statusText} - ${text.substring(0, 200)}`);
    }
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    console.warn('[API] Non-JSON response:', contentType);
    return { status: 'success' };
  }
  
  try {
    const result = await response.json();
    console.log('[API] Response received:', result);
    
    // Return the full response object to allow access to all properties
    // This allows components to handle both nested and direct response structures
    return result;
  } catch (err) {
    console.error('[API] Failed to parse JSON response:', err);
    throw new Error('Invalid JSON response from server');
  }
};
