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

// New function to train AutoML models with custom experiment name
export const automlTrain = async (
  datasetId: string,
  taskType: string,
  automlEngine: string,
  testSize: number,
  stratify: boolean,
  randomSeed: number,
  experimentName?: string | null,
  presetProfile?: string | null
) => {
  try {
    console.log('[API] Starting AutoML training with custom name:', experimentName);
    const headers = await getAuthHeaders();
    
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('task_type', taskType);
    formData.append('automl_engine', automlEngine);
    formData.append('test_size', testSize.toString());
    formData.append('stratify', stratify ? 'true' : 'false');
    formData.append('random_seed', randomSeed.toString());
    
    // Add experiment name if provided - log for debugging
    if (experimentName) {
      console.log('[API] Setting experiment name in request:', experimentName);
      formData.append('experiment_name', experimentName);
    }
    
    // Add preset profile if provided
    if (presetProfile) {
      console.log('[API] Setting preset profile in request:', presetProfile);
      formData.append('preset_profile', presetProfile);
    }
    
    // FIXED: When sending FormData, don't set Content-Type header
    // Let the browser set it automatically with proper multipart boundary
    const response = await fetch(`${API_BASE_URL}/training/automl/`, {
      method: 'POST',
      headers: {
        Authorization: headers.Authorization
      },
      body: formData,
    });

    // Enhanced error logging
    if (!response.ok) {
      const errorData = await response.text();
      console.error('[API] AutoML training error response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        body: errorData.substring(0, 500),
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error(errorData || `HTTP error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[API] AutoML training started successfully. Result:', result);
    return result.data;
  } catch (error) {
    console.error('[API] Error in automlTrain:', error);
    throw error;
  }
};

// Helper function to categorize visualization files
const categorizeVisualizationFiles = (files: any[] = []): Record<string, any[]> => {
  const visualizationsByType: Record<string, any[]> = {
    predictions: [],
    confusion_matrix: [],
    evaluation: [],
    explainability: [],
    feature_importance: [],
    model: [],
    pdp: [], // PDP plots category
    ice: [], // ICE plots category
    other: []
  };

  files.forEach(file => {
    const fileType = file.file_type?.toLowerCase() || '';

    if (fileType === 'model' || fileType === 'trained_model') {
      visualizationsByType.model.push(file);
    } else if (fileType.includes('predictions') || fileType.includes('prediction')) {
      visualizationsByType.predictions.push(file);
    } else if (fileType.includes('confusion_matrix')) {
      visualizationsByType.confusion_matrix.push(file);
    } else if (fileType.includes('roc') || fileType.includes('precision_recall') || 
               fileType.includes('auc') || fileType.includes('metrics_curve')) {
      visualizationsByType.evaluation.push(file);
    } else if (fileType.includes('shap') || fileType.includes('explain')) {
      visualizationsByType.explainability.push(file);
    } else if (fileType.includes('importance') || fileType.includes('feature_impact')) {
      visualizationsByType.feature_importance.push(file);
    } else if (fileType.includes('pdp_')) {
      visualizationsByType.pdp.push(file); // Categorize PDP plots
    } else if (fileType.includes('ice_')) {
      visualizationsByType.ice.push(file); // Categorize ICE plots
    } else if (fileType === 'leaderboard_csv' || fileType === 'leaderboard') {
      if (!visualizationsByType.leaderboard) {
        visualizationsByType.leaderboard = [];
      }
      visualizationsByType.leaderboard.push(file);
    } else {
      visualizationsByType.other.push(file);
    }
  });

  // Clean up empty categories
  Object.keys(visualizationsByType).forEach(key => {
    if (visualizationsByType[key].length === 0) {
      delete visualizationsByType[key];
    }
  });

  return visualizationsByType;
};

// Fetch experiment results endpoint (returns detailed results for experiment)
export const getExperimentResults = async (
  experimentId: string
): Promise<ExperimentResults | null> => {
  try {
    console.log('[API] Fetching full results for experiment:', experimentId);
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/experiments/experiment-results/${experimentId}`,
      { headers }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Your session has expired. Please log in again.');
      }
      const errorText = await response.text().catch(() => "");
      console.error('[API] Error fetching results:', errorText.substring(0, 200));
      throw new Error(`Failed to fetch experiment results: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    let apiResponse: any;
    
    try {
      apiResponse = JSON.parse(responseText);
      console.log('[API] Parsed API response:', apiResponse);
    } catch (err) {
      console.error('[API] JSON parse error:', err);
      throw new Error('Invalid JSON response from server');
    }

    // Extract data from the response envelope
    const result = apiResponse.data;
    
    if (!result) {
      console.error('[API] No data in API response');
      return null;
    }

    // Check for leaderboard CSV data
    const leaderboardFile = result.files?.find((file: any) => 
      file.file_type === 'leaderboard_csv' || 
      file.file_url?.includes('leaderboard')
    );

    // Process files to extract visualizations by type
    const visualizations_by_type = result.visualizations_by_type || 
                                  categorizeVisualizationFiles(result.files);

    // Map the API response to our ExperimentResults type
    const experimentResults: ExperimentResults = {
      experimentId: result.experimentId || result.experiment_id,
      experiment_id: result.experimentId || result.experiment_id,
      experiment_name: result.experiment_name,
      status: result.status,
      task_type: result.task_type,
      target_column: result.target_column,
      created_at: result.created_at,
      completed_at: result.completed_at,
      error_message: result.error_message,
      training_time_sec: result.training_time_sec,
      metrics: result.metrics || {},
      files: result.files || [],
      algorithm: result.algorithm,
      algorithm_choice: result.algorithm_choice,
      model_format: result.model_format,
      model_file_url: result.files?.find(f => f.file_type === 'model')?.file_url,
      report_file_url: result.files?.find(f => f.file_type === 'report')?.file_url,
      hyperparameters: result.hyperparameters,
      message: result.message,
      automl_engine: result.automl_engine,
      class_labels: result.class_labels,
      training_type: result.training_type || (result.automl_engine ? 'automl' : 'custom'),
      model_display_name: result.model_display_name,
      leaderboard: result.leaderboard,
      leaderboard_csv: result.leaderboard_csv || (leaderboardFile ? leaderboardFile.file_content : null),
      visualizations_by_type: visualizations_by_type,
      pdp_ice_metadata: result.pdp_ice_metadata || [],
      training_results: {
        metrics: result.metrics,
        classification_report: result.metrics?.classification_report,
        confusion_matrix: result.metrics?.confusion_matrix,
      }
    };

    console.log('[API] Mapped experiment results:', experimentResults);
    return experimentResults;
  } catch (error) {
    console.error('[API] Error in getExperimentResults:', error);
    throw error;
  }
};

// Get prediction schema for an experiment
export interface ColumnSchema {
  name: string;
  type: 'categorical' | 'numerical';
  values?: string[] | 'too_many';
  range?: [number, number];
}

export interface PredictionSchema {
  columns: ColumnSchema[];
  target: string;
  example: Record<string, any>;
  // Maintain backward compatibility with old API response
  features?: string[];
  target_column?: string;
  sample_row?: Record<string, any>;
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
    
    // Map the response to the expected interface format
    const payload = data.data ?? data;
    
    // Return the unified schema format
    const result: PredictionSchema = {
      // Handle new format
      columns: payload.columns || [],
      target: payload.target || '',
      example: payload.example || {},
      
      // Handle legacy format for backward compatibility
      features: payload.features || [],
      target_column: payload.target_column || payload.target || '',
      sample_row: payload.sample_row || payload.example || {}
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

// New function to fetch MLJAR presets
export interface MLJARPreset {
  name: string;
  description: string;
  mode: string;
  time_limit: number;
}

export const getMljarPresets = async (): Promise<MLJARPreset[]> => {
  try {
    console.log('[API] Fetching MLJAR presets');
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/training/automl/get-mljar-presets/`, { 
      headers 
    });

    if (!response.ok) {
      console.error('[API] Error fetching MLJAR presets:', response.status, response.statusText);
      return []; // Return empty array on error
    }

    const data = await response.json();
    console.log('[API] MLJAR presets received:', data);
    return data.presets || [];
  } catch (error) {
    console.error('[API] Error fetching MLJAR presets:', error);
    return []; // Return empty array on error
  }
};

// New interface for H2O presets
export interface H2OPreset {
  name: string;
  description: string;
  max_runtime_secs: number;
  nfolds: number;
  balance_classes: boolean;
  exclude_algos: string[];
  sort_metric: string;
}

// Modified H2O presets function with improved error handling
export const getH2OPresets = async (): Promise<H2OPreset[]> => {
  try {
    console.log('[API] Fetching H2O presets');
    const headers = await getAuthHeaders();
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_BASE_URL}/training/automl/get-h2o-presets/`, { 
      headers,
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      console.error('[API] Error fetching H2O presets:', response.status, response.statusText);
      // Return default presets on error
      return getDefaultH2OPresets();
    }

    const data = await response.json();
    console.log('[API] H2O presets received:', data);
    
    // Ensure presets is an array and not empty
    if (!data.presets || !Array.isArray(data.presets) || data.presets.length === 0) {
      console.warn('[API] H2O presets missing or empty in response, using defaults');
      return getDefaultH2OPresets();
    }
    
    return data.presets;
  } catch (error) {
    console.error('[API] Error fetching H2O presets:', error);
    // Return default presets on any error
    return getDefaultH2OPresets();
  }
};

// Helper function to provide default H2O presets when API fails
function getDefaultH2OPresets(): H2OPreset[] {
  console.log('[API] Using default H2O presets');
  return [
    {
      name: "balanced",
      description: "Balanced runtime and accuracy with default settings.",
      max_runtime_secs: 1200,
      nfolds: 5,
      balance_classes: true,
      exclude_algos: [],
      sort_metric: "AUTO"
    },
    {
      name: "fast",
      description: "Quick training using fewer folds and excluding Deep Learning.",
      max_runtime_secs: 600,
      nfolds: 3,
      balance_classes: false,
      exclude_algos: ["DeepLearning", "StackedEnsemble"],
      sort_metric: "AUTO"
    },
    {
      name: "accurate",
      description: "Max accuracy with 10-fold CV and full algorithm set.",
      max_runtime_secs: 2400,
      nfolds: 10,
      balance_classes: true,
      exclude_algos: [],
      sort_metric: "AUTO"
    }
  ];
}
