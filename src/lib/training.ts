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
    const response = await fetch(`${API_BASE_URL}/experiments/experiment-results/${experimentId}`, {
      headers
    });

    // Defensive: try parsing, but catch invalid formatting
    let apiResponse: any;
    try {
      apiResponse = await handleApiResponse<ExperimentResults>(response);
    } catch (err: any) {
      // If handleApiResponse threw due to invalid JSON/HTML, log, then throw normal error
      console.error('[API] handleApiResponse error (likely non-JSON):', err);
      // Edge-case: try to extract any text error from response
      const text = await response.text().catch(() => "");
      if (text.startsWith('<!DOCTYPE')) {
        throw new Error('Server returned an HTML error page instead of JSON. Please check server logs.');
      }
      throw err;
    }

    // Log the full structure for debugging:
    console.log('[API] Results data received:', apiResponse);

    // Validate structure: should be an object with key fields for ExperimentResults
    if (
      apiResponse &&
      typeof apiResponse === "object" &&
      (apiResponse.status === 'success' || apiResponse.status === 'completed' || apiResponse.status === 'failed')
    ) {
      // Some backends may wrap "data" under apiResponse.data, some may not.
      const hasExperimentFields = (
        (apiResponse.data && apiResponse.data.experiment_name) ||
        apiResponse.experiment_name
      );

      // If this is the old/bad shape, surface a helpful error
      if (
        apiResponse.hasTrainingResults !== undefined &&
        !hasExperimentFields
      ) {
        throw new Error('Training results are not yet available. The server replied with a non-standard result object. Please wait a few more moments and retry, or check backend status.');
      }

      // If we detect a success + missing results payload, inform user
      if (apiResponse.status === 'success' && apiResponse.hasTrainingResults === false) {
        throw new Error('Training completed, but results are not yet available. Please wait a few moments.');
      }

      // Defensive: return .data if present, else the root object if conformant
      const pruned =
        apiResponse.data && hasExperimentFields
          ? apiResponse.data
          : hasExperimentFields
            ? apiResponse
            : null;

      if (pruned) {
        return pruned as ExperimentResults;
      }
    }

    // Fallback error if nothing matches above
    throw new Error('Invalid response format from experiment results endpoint');
  } catch (error) {
    console.error('[API] Error fetching experiment results:', error);
    throw error;
  }
};
