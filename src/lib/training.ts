
import { getAuthHeaders, handleApiResponse } from './utils';
import { ApiResponse, ExperimentStatusResponse } from '@/types/api';
import { ExperimentResults } from '@/types/training';
import { API_BASE_URL } from './constants';

// Check training status endpoint (returns { status, hasTrainingResults, ... })
export const checkStatus = async (experimentId: string): Promise<ApiResponse<ExperimentStatusResponse>> => {
  try {
    console.log('[API] Checking status for experiment:', experimentId);
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/training/check-status/${experimentId}`, {
      headers
    });

    return handleApiResponse<ExperimentStatusResponse>(response);
  } catch (error) {
    console.error('[API] Error checking training status:', error);
    throw error;
  }
};

// Fetch experiment results endpoint (returns detailed results for experiment)
export const getExperimentResults = async (
  experimentId: string
): Promise<ExperimentResults | null> => {
  try {
    const headers = await getAuthHeaders();
    
    // Fetch results from the canonical endpoint
    const response = await fetch(
      `${API_BASE_URL}/experiments/experiment-results/${experimentId}`,
      { headers }
    );

    // Handle non-OK responses
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Your session has expired. Please log in again.');
      }
      
      const errorText = await response.text().catch(() => "");
      if (errorText.startsWith('<!DOCTYPE')) {
        throw new Error('Server returned an HTML error page instead of JSON. Please check server logs.');
      }
      
      console.error('[API] Error fetching results:', errorText.substring(0, 200) + (errorText.length > 200 ? '...' : ''));
      throw new Error(`Failed to fetch experiment results: ${response.status} ${response.statusText}`);
    }

    // Parse the response
    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      throw new Error('Server returned an empty response');
    }
    
    let apiResponse: any;
    try {
      apiResponse = JSON.parse(responseText);
    } catch (err) {
      console.error('[API] JSON parse error:', err);
      throw new Error('Invalid JSON response from server');
    }

    // Unwrap envelope: { status, data }
    const payload = apiResponse.data ?? apiResponse;

    // If results aren't ready yet, just return null (not an error!)
    if (payload.hasTrainingResults === false) {
      return null;
    }

    return payload as ExperimentResults;
  } catch (error) {
    console.error('[API] Error fetching experiment results:', error);
    throw error;
  }
};
