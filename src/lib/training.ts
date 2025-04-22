
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
    // Ensure we call the correct backend route
    const response = await fetch(`${API_BASE_URL}/experiments/experiment-results/${experimentId}`, {
      headers
    });

    const apiResponse = await handleApiResponse<ExperimentResults>(response);

    // Log the full structure for debugging:
    console.log('[API] Results data received:', apiResponse);

    // Defensive check for result presence
    if (
      apiResponse.status === 'success' &&
      ((apiResponse.data && (apiResponse as any).hasTrainingResults !== false) || apiResponse.data)
    ) {
      return apiResponse.data;
    }

    // If training results not yet ready, throw a user-friendly error
    if ((apiResponse as any).status === "success" && (apiResponse as any).hasTrainingResults === false) {
      throw new Error('Training completed, but results are not yet available. Please wait a few moments.');
    }

    throw new Error('Invalid response format from experiment results endpoint');
  } catch (error) {
    console.error('[API] Error fetching experiment results:', error);
    throw error;
  }
};

