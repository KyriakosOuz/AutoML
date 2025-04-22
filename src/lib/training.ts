import { getAuthHeaders, handleApiResponse } from './utils';
import { ApiResponse, ExperimentStatusResponse } from '@/types/api';
import { 
  ExperimentResults, 
  ManualPredictionResponse, 
  BatchPredictionResponse 
} from '@/types/training';
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
export async function predictManual(
  experimentId: string,
  inputValues: Record<string, any>
): Promise<ManualPredictionResponse> {
  const headers = await getAuthHeaders();
  // Remove Content-Type for FormData (the browser sets it itself)
  const form = new FormData();
  form.append('experiment_id', experimentId);
  form.append('input_values', JSON.stringify(inputValues));

  // Omit Content-Type header so boundary is set correctly by browser
  delete (headers as any)['Content-Type'];

  const res = await fetch(
    `${API_BASE_URL}/prediction/predict-manual/`,
    {
      method: 'POST',
      headers,
      body: form
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function predictBatchCsv(
  experimentId: string,
  file: File
): Promise<BatchPredictionResponse> {
  const headers = await getAuthHeaders();
  // Remove Content-Type for FormData (the browser sets it itself)
  const form = new FormData();
  form.append('experiment_id', experimentId);
  form.append('file', file);

  // Omit Content-Type header so boundary is set correctly by browser
  delete (headers as any)['Content-Type'];

  const res = await fetch(
    `${API_BASE_URL}/prediction/predict-csv/`,
    {
      method: 'POST',
      headers,
      body: form
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
