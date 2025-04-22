
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
      if (errorText.startsWith('<!DOCTYPE')) {
        throw new Error('Server returned an HTML error page instead of JSON. Please check server logs.');
      }
      console.error('[API] Error fetching results:', errorText.substring(0, 200) + (errorText.length > 200 ? '...' : ''));
      throw new Error(`Failed to fetch experiment results: ${response.status} ${response.statusText}`);
    }

    // Always try to parse the response as JSON
    let apiResponse: any;
    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      throw new Error('Server returned an empty response');
    }
    // check for HTML response
    if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
      throw new Error('Server returned HTML instead of JSON. Check server configuration.');
    }

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
    const payload = apiResponse.data ?? apiResponse;
    console.log('[API] Unwrapped payload keys:', Object.keys(payload));

    // CRITICAL FIX: Only check for hasTrainingResults if it's explicitly false
    // Most APIs don't include hasTrainingResults when results are actually present
    if (payload.hasTrainingResults === false) {
      console.log('[API] Training results not ready yet according to hasTrainingResults flag');
      return null;
    }

    // Log training results structure if present
    if (payload.training_results) {
      console.log('[API] Training results structure:', {
        hasMetrics: !!payload.training_results.metrics,
        metricsKeys: Object.keys(payload.training_results.metrics || {}),
        hasClassificationReport: !!payload.training_results.metrics?.classification_report,
        classificationReportType: typeof payload.training_results.metrics?.classification_report,
        classificationReportKeys: payload.training_results.metrics?.classification_report ? 
          Object.keys(payload.training_results.metrics.classification_report) : 'none'
      });
    }

    // If we have actual results data (either in training_results or metrics directly)
    // then set hasTrainingResults to true explicitly for consistency
    if (
      (payload.training_results && Object.keys(payload.training_results).length > 0) ||
      (payload.metrics && Object.keys(payload.metrics).length > 0)
    ) {
      payload.hasTrainingResults = true;
    }

    // At this point, payload should be a full ExperimentResults
    console.log('[API] Results data received:', payload);
    return payload as ExperimentResults;
  } catch (error) {
    console.error('[API] Error fetching experiment results:', error);
    throw error;
  }
};
