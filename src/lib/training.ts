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
export const getExperimentResults = async (experimentId: string): Promise<ExperimentResults> => {
  try {
    console.log('[API] Fetching results for experiment:', experimentId);
    const headers = await getAuthHeaders();
    
    // First try using the /experiments/experiment-results endpoint
    let response = await fetch(`${API_BASE_URL}/experiments/experiment-results/${experimentId}`, {
      headers
    });
    
    // If response is not ok, try fallback endpoint as a last resort
    if (!response.ok && response.status !== 401) { // Don't retry on auth errors
      console.warn('[API] Primary endpoint failed, status:', response.status);
      
      // Only log the error, don't throw yet - we'll try the fallback
      const errorText = await response.text().catch(() => "");
      console.error('[API] Error response text:', errorText.substring(0, 200) + (errorText.length > 200 ? '...' : ''));
      
      // Try alternative endpoint as fallback
      response = await fetch(`${API_BASE_URL}/training/experiment-results/${experimentId}`, {
        headers
      });
    }

    // If we still have a non-OK response, handle the error
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Your session has expired. Please log in again.');
      }
      
      const errorText = await response.text().catch(() => "");
      if (errorText.startsWith('<!DOCTYPE')) {
        throw new Error('Server returned an HTML error page instead of JSON. Please check server logs.');
      }
      
      throw new Error(`Failed to fetch experiment results: ${response.status} ${response.statusText}`);
    }
    
    // Try to parse the JSON - get the raw text first to help with debugging
    const responseText = await response.text();
    
    if (!responseText || responseText.trim() === '') {
      throw new Error('Server returned an empty response');
    }
    
    // Check if it's HTML (which would cause JSON.parse to fail)
    if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
      throw new Error('Server returned HTML instead of JSON. Check server configuration.');
    }
    
    // Parse the text as JSON, expect only the canonical format
    let apiResponse: any;
    try {
      apiResponse = JSON.parse(responseText);
    } catch (err) {
      console.error('[API] JSON parse error:', err);
      console.error('[API] Failed to parse response text:', responseText.substring(0, 200) + '...');
      throw new Error('Invalid JSON response from server');
    }

    // Log the full structure for debugging
    // console.log('[API] Results data received:', apiResponse);

    // Accept ONLY the canonical format: { experiment_id, status, ... }
    if (
      typeof apiResponse === 'object' &&
      (apiResponse.experiment_id || apiResponse.experiment_name)
    ) {
      // If we receive hasTrainingResults: false, indicate results not ready yet
      if (apiResponse.hasTrainingResults === false) {
        throw new Error('Training completed, but results are not yet available. Please wait a few moments.');
      }
      // Otherwise, treat as valid results object
      return apiResponse as ExperimentResults;
    }

    // As a safety, check old data-wrapping (should not happen in new backend structure)
    if (apiResponse.status === 'success' && typeof apiResponse.data === 'object') {
      const data = apiResponse.data;
      if (data.hasTrainingResults === false) {
        throw new Error('Training completed, but results are not yet available. Please wait a few moments.');
      }
      return data as ExperimentResults;
    }
    
    throw new Error('Invalid or empty response format from experiment results endpoint');
  } catch (error) {
    console.error('[API] Error fetching experiment results:', error);
    throw error;
  }
};
