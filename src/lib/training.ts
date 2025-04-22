
import { getAuthHeaders, handleApiResponse } from './utils';
import { ApiResponse, ExperimentStatusResponse } from '@/types/api';
import { ExperimentResults } from '@/types/training';

export const checkStatus = async (experimentId: string): Promise<ApiResponse<ExperimentStatusResponse>> => {
  try {
    console.log('[API] Checking status for experiment:', experimentId);
    const response = await fetch(`${import.meta.env.VITE_API_URL}/training/check-status/${experimentId}`, {
      headers: getAuthHeaders(),
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
    const response = await fetch(`${import.meta.env.VITE_API_URL}/experiments/experiment-results/${experimentId}`, {
      headers: getAuthHeaders()
    });

    const apiResponse = await handleApiResponse<ExperimentResults>(response);
    
    // Extract the data property from the ApiResponse
    if (apiResponse.status === 'success' && apiResponse.data) {
      return apiResponse.data;
    }
    
    // If no data property exists, the response itself might be the ExperimentResults
    // This handles backward compatibility with APIs that don't follow the ApiResponse format
    return apiResponse as unknown as ExperimentResults;
  } catch (error) {
    console.error('[API] Error fetching experiment results:', error);
    throw error;
  }
};
