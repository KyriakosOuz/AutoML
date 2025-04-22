
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

    return handleApiResponse<ExperimentResults>(response);
  } catch (error) {
    console.error('[API] Error fetching experiment results:', error);
    throw error;
  }
};
