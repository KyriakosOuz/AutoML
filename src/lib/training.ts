
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
    console.log('[API] Fetching results for experiment:', experimentId);
    const headers = await getAuthHeaders();

    // Use the correct endpoint as per backend implementation
    let response = await fetch(
      `${API_BASE_URL}/experiments/experiment-results/${experimentId}`,
      { headers }
    );

    if (!response.ok && response.status !== 401) {
      console.warn('[API] Primary endpoint failed, retrying...');
      response = await fetch(
        `${API_BASE_URL}/experiments/experiment-results/${experimentId}`,
        { headers }
      );
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Your session has expired. Please log in again.');
      }
      const errorText = await response.text().catch(() => "");
      console.error('[API] Error fetching results:', errorText.substring(0, 200) + (errorText.length > 200 ? '...' : ''));
      throw new Error(`Failed to fetch experiment results: ${response.status} ${response.statusText}`);
    }

    // Always try to parse the response as JSON
    let apiResponse: any;
    const responseText = await response.text();
    
    try {
      apiResponse = JSON.parse(responseText);
      console.log('[API] Full API response structure:', {
        keys: Object.keys(apiResponse),
        hasStatus: 'status' in apiResponse,
        hasData: 'data' in apiResponse
      });
    } catch (err) {
      console.error('[API] JSON parse error:', err);
      console.error('[API] Failed to parse response text:', responseText.substring(0, 200) + '...');
      throw new Error('Invalid JSON response from server');
    }

    // Unwrap envelope: { status, data }
    const result = apiResponse.data ?? apiResponse;
    console.log('[API] Unwrapped payload keys:', Object.keys(result));

    return result;
  } catch (error) {
    console.error('[API] Error in getExperimentResults:', error);
    throw error;
  }
};
