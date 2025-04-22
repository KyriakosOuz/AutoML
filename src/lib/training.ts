
// Library for training and prediction-related API calls

const API_BASE = window.location.origin;

import { getAuthHeaders, handleApiResponse } from './utils';
import { ApiResponse, ExperimentStatusResponse } from '@/types/api';
import { 
  ExperimentResults, 
  ManualPredictionResponse, 
  BatchPredictionResponse 
} from '@/types/training';
// Remove old import for constants
// import { API_BASE_URL } from './constants';

// Check training status endpoint (returns { status, hasTrainingResults, ... })
export const checkStatus = async (experimentId: string): Promise<ApiResponse<ExperimentStatusResponse>> => {
  try {
    console.log('[API] Checking status for experiment:', experimentId);
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/training/check-status/${experimentId}`, {
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
      `${API_BASE}/experiments/experiment-results/${experimentId}`,
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

// Helper to extract error details from FastAPI error responses
async function extractApiError(response: Response, fallbackMessage: string): Promise<string> {
  const text = await response.text();
  if (!text) return fallbackMessage;

  try {
    // Try to extract { detail: ... } from response
    const json = JSON.parse(text);
    if (json && typeof json.detail === 'string') {
      return json.detail;
    }
    // Sometimes FastAPI returns { detail: [ { loc, msg, type } ] }
    if (json && Array.isArray(json.detail) && json.detail[0]?.msg) {
      return json.detail.map((err: any) => err.msg).join(', ');
    }
  } catch {
    // Not JSON, just return the start of the text
  }
  return text.substring(0, 200) || fallbackMessage;
}

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
      `${API_BASE}/prediction/predict-manual/`,
      {
        method: 'POST',
        headers: {
          'Authorization': headers.Authorization
        },
        body: formData
      }
    );

    // Read the response as text first
    const responseText = await response.text();
    if (!response.ok) {
      const errorMsg = await extractApiError(response, `Prediction failed: ${response.status} ${response.statusText}`);
      console.error('[API] Manual prediction error:', {
        status: response.status,
        response: responseText.substring(0, 200),
        errorMsg
      });
      throw new Error(errorMsg);
    }

    // Check for empty response
    if (!responseText || responseText.trim().length === 0) {
      console.error('[API] Manual prediction: empty response body');
      throw new Error("Prediction failed: Server returned empty response. Please try again or contact support.");
    }

    // Parse JSON safely
    try {
      return JSON.parse(responseText);
    } catch (err) {
      console.error('[API] Manual prediction: failed to parse JSON:', err, responseText.substring(0, 200));
      throw new Error("Prediction failed: Invalid JSON response from server");
    }
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
      `${API_BASE}/prediction/predict-csv/`,
      {
        method: 'POST',
        headers: {
          'Authorization': headers.Authorization
        },
        body: formData
      }
    );

    // Read the response as text first
    const responseText = await response.text();
    if (!response.ok) {
      const errorMsg = await extractApiError(response, `Batch prediction failed: ${response.status} ${response.statusText}`);
      console.error('[API] Batch prediction error:', {
        status: response.status,
        response: responseText.substring(0, 200),
        errorMsg
      });
      throw new Error(errorMsg);
    }

    // Check for empty response
    if (!responseText || responseText.trim().length === 0) {
      console.error('[API] Batch prediction: empty response body');
      throw new Error("Batch prediction failed: Server returned empty response. Please try again.");
    }

    // Parse JSON safely
    try {
      return JSON.parse(responseText);
    } catch (err) {
      console.error('[API] Batch prediction: failed to parse JSON:', err, responseText.substring(0, 200));
      throw new Error("Batch prediction failed: Invalid JSON response from server");
    }
  } catch (error) {
    console.error('[API] Error in batch prediction:', error);
    throw error;
  }
};

