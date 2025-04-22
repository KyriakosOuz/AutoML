import { getAuthHeaders, handleApiResponse } from './utils';
import { ApiResponse, ExperimentStatusResponse } from '@/types/api';
import { ExperimentResults } from '@/types/training';
import { API_BASE_URL } from './constants';

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

export const getExperimentResults = async (experimentId: string): Promise<ExperimentResults> => {
  try {
    console.log('[API] Fetching results for experiment:', experimentId);
    const headers = await getAuthHeaders();
    // Update fetch endpoint to use correct backend route
    const response = await fetch(`${API_BASE_URL}/experiments/experiment-results/${experimentId}`, {
      headers
    });

    const apiResponse = await handleApiResponse<ExperimentResults>(response);

    if (apiResponse.status === 'success' && apiResponse.data) {
      return apiResponse.data;
    }
    
    throw new Error('Invalid response format from experiment results endpoint');
  } catch (error) {
    console.error('[API] Error fetching experiment results:', error);
    throw error;
  }
};
