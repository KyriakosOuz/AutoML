import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ApiResponse } from "@/types/api"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const handleApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Server returned non-JSON response:', {
      status: response.status,
      contentType,
      text: text.substring(0, 200)
    });
    throw new Error(`Server returned non-JSON response (${response.status})`);
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const jsonData = await response.json();
  
  // Ensure the returned data conforms to ApiResponse structure
  if (!jsonData.hasOwnProperty('status') || !jsonData.hasOwnProperty('data')) {
    // If the API doesn't return in the expected format, transform it
    return {
      status: 'success',
      data: jsonData as T
    };
  }
  
  return jsonData as ApiResponse<T>;
};
