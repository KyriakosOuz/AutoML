
import { getAuthToken } from '@/contexts/AuthContext';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getAuthHeaders = () => {
  const token = getAuthToken();
  
  if (!token) {
    console.warn('No authentication token available. User may need to log in.');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    try {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const errorJson = await response.json();
        throw new Error(errorJson.detail || errorJson.message || `Error: ${response.status} ${response.statusText}`);
      } else {
        const errorText = await response.text();
        
        if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
          console.error("Server returned HTML instead of JSON:", errorText.substring(0, 200));
          throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
        } else {
          throw new Error(`Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
        }
      }
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        throw new Error(`Failed to parse error response: ${response.status} ${response.statusText}`);
      }
      throw parseError;
    }
  }

  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    console.warn("Response is not JSON:", contentType);
    return {};
  }
  
  try {
    const data = await response.json();
    return data.data?.experiment_results || data.experiment_results || data;
  } catch (err) {
    console.error('❌ Failed to parse JSON response:', err);
    try {
      const text = await response.text();
      console.error("Invalid JSON response:", text.substring(0, 200));
    } catch (textError) {
      console.error("Could not read response as text either:", textError);
    }
    throw new Error('Failed to parse JSON response from server');
  }
};
