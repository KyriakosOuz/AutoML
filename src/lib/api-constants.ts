
// API Base URLs without /app/ prefix since API endpoints remain at root
export const API_BASE_URL = "/";  // Backend API remains at root

// Dataset endpoints
export const DATASET_API = {
  UPLOAD: "/dataset/upload/",
  OVERVIEW: "/dataset/dataset-overview/",
  PREVIEW: "/dataset/preview/",
  FEATURES: "/dataset/features/",
  IMPORTANCE: "/feature-importance/",
  SAVE: "/dataset/save-dataset/",
  LIST: "/dataset/list/",
  DELETE: "/dataset/delete/"
};

// Training endpoints
export const TRAINING_API = {
  AUTOML: "/automl-train/",
  CUSTOM: "/custom-train/",
  EXPERIMENT_STATUS: "/experiment-status/",
  EXPERIMENT_RESULTS: "/experiment-results/",
  LIST_EXPERIMENTS: "/list-experiments/",
  DELETE_EXPERIMENT: "/delete-experiment/"
};

// Prediction endpoints
export const PREDICTION_API = {
  PREDICT: "/predict/",
  BATCH_PREDICT: "/batch-predict/",
};
