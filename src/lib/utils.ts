import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ApiResponse } from "@/types/api"
import { supabase } from "@/integrations/supabase/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const handleApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Expected JSON but got: ${text.slice(0, 100)}`);
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const jsonData = await response.json();
  
  if (!jsonData.hasOwnProperty('status') || !jsonData.hasOwnProperty('data')) {
    return {
      status: 'success',
      data: jsonData as T
    };
  }
  
  return jsonData as ApiResponse<T>;
};
