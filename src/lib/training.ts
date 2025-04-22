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

// Get prediction schema for an experiment
export interface PredictionSchema {
  features: string[];
  target_column: string;
  sample_row: Record<string, any>;
  columns: string[];
  target: string;
  example: Record<string, any>;
}

export const getPredictionSchema = async (experimentId: string): Promise<PredictionSchema> => {
  try {
    console.log('[API] Fetching prediction schema for experiment:', experimentId);
    const headers = await getAuthHeaders();
    // Use GET with auth headers
    const response = await fetch(
      `${API_BASE_URL}/prediction/schema/${experimentId}`,
      { headers }
    );
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error('[API] Error fetching prediction schema:', errorText.substring(0, 200));
      throw new Error(`Failed to fetch prediction schema: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log('[API] Prediction schema:', data);
    // Map the response to the expected interface format if needed
    const payload = data.data ?? data;
    const result: PredictionSchema = {
      features: payload.features || [],
      target_column: payload.target_column || '',
      sample_row: payload.sample_row || {},
      columns: payload.columns || payload.features || [],
      target: payload.target || payload.target_column || '',
      example: payload.example || payload.sample_row || {}
    };
    return result;
  } catch (error) {
    console.error('[API] Error in getPredictionSchema:', error);
    throw error;
  }
};

// Submit manual prediction
export const submitManualPrediction = async (
  experimentId: string, 
  inputValues: Record<string, any>
): Promise<any> => {
  try {
    console.log('[API] Submitting manual prediction for experiment:', experimentId);
    console.log('[API] Input values:', inputValues);
    const headers = await getAuthHeaders();
    const formData = new FormData();
    formData.append('experiment_id', experimentId);
    formData.append('input_values', JSON.stringify(inputValues));
    const response = await fetch(
      `${API_BASE_URL}/prediction/predict-manual/`,
      { 
        method: 'POST',
        headers: {
          ...headers,
        },
        body: formData
      }
    );
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error('[API] Error submitting prediction:', errorText.substring(0, 200));
      throw new Error(`Failed to submit prediction: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log('[API] Prediction response:', data);
    return data.data || data;
  } catch (error) {
    console.error('[API] Error in submitManualPrediction:', error);
    throw error;
  }
};

// Manual prediction helper: POST with FormData and auth headers
export async function predictManual(experimentId: string, inputs: Record<string, any>) {
  const headers = await getAuthHeaders();
  const form = new FormData();
  form.append('experiment_id', experimentId);
  form.append('input_values', JSON.stringify(inputs));
  const url = `${API_BASE_URL}/prediction/predict-manual/`;
  const res = await fetch(
    url,
    { 
      method: 'POST', 
      headers,
      body: form 
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
