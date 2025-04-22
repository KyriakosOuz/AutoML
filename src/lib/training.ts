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
    console.log('[API] Fetching full results for experiment:', experimentId);
    const headers = await getAuthHeaders();

    // Always use the correct endpoint for full experiment results
    const response = await fetch(
      `${API_BASE_URL}/experiments/experiment-results/${experimentId}`,
      { headers }
    );

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

// Prediction endpoints
export const predictManual = async (
  experimentId: string,
  inputValues: Record<string, any>
): Promise<ManualPredictionResponse> => {
  try {
    console.log('[API] Making manual prediction for experiment:', experimentId);
    const headers = await getAuthHeaders();
    
    const formData = new FormData();
    formData.append('experiment_id', experimentId);
    formData.append('input_values', JSON.stringify(inputValues));

    const response = await fetch(
      `https://smart-whole-cockatoo.ngrok-free.app/prediction/predict-manual/`,
      {
        method: 'POST',
        headers: {
          'Authorization': headers.Authorization
        },
        body: formData
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Manual prediction error:', {
        status: response.status,
        response: errorText.substring(0, 200)
      });
      throw new Error(`Prediction failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Error in manual prediction:', error);
    throw error;
  }
};

export const predictBatchCsv = async (
  experimentId: string,
  file: File
): Promise<BatchPredictionResponse> => {
  try {
    console.log('[API] Making batch prediction for experiment:', experimentId);
    const headers = await getAuthHeaders();
    
    const formData = new FormData();
    formData.append('experiment_id', experimentId);
    formData.append('file', file);

    const response = await fetch(
      `https://smart-whole-cockatoo.ngrok-free.app/prediction/predict-csv/`,
      {
        method: 'POST',
        headers: {
          'Authorization': headers.Authorization
        },
        body: formData
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Batch prediction error:', {
        status: response.status,
        response: errorText.substring(0, 200)
      });
      throw new Error(`Batch prediction failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Error in batch prediction:', error);
    throw error;
  }
};
