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

// Enhanced error handling for API responses with connection checks
export const handleApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  // First check if the response is ok
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[API] Error response:', {
      status: response.status,
      text: errorText.substring(0, 200)
    });
    
    // Check for common connection issues
    if (response.status === 0 || response.status === 504) {
      throw new Error('Connection error: Unable to reach the server. Please check your internet connection.');
    }
    
    // Check if we received an HTML error page (like ngrok interstitial)
    if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
      if (errorText.includes('ngrok')) {
        throw new Error('Connection error: The API server needs to be restarted. Please contact support.');
      }
      throw new Error('Connection error: Received HTML instead of JSON response. The server might be down.');
    }
    
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.message || `Request failed: ${response.status}`);
    } catch (e) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }
  }

  const contentType = response.headers.get('content-type');
  
  // Handle non-JSON responses with more specific error messages
  if (!contentType || !contentType.includes('application/json')) {
    console.error('[API] Unexpected content type:', contentType);
    if (contentType?.includes('text/html')) {
      throw new Error('Invalid response: Server returned an HTML page instead of JSON. Please try again.');
    }
    throw new Error(`Invalid response: Expected JSON but received ${contentType || 'unknown content type'}`);
  }

  try {
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] JSON parse error:', error);
    throw new Error('Failed to parse server response');
  }
};

// New utility to implement exponential backoff for retries
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
