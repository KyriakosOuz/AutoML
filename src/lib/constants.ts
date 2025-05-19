export const API_BASE_PATH = "/api";

// 🌐 Dynamic API base URL
export const API_BASE_URL = (() => {
  const viteUrl = import.meta.env.VITE_API_URL;
  if (viteUrl) return viteUrl.endsWith("/") ? viteUrl.slice(0, -1) : viteUrl;

  // In browser context: return based on location
  if (typeof window !== "undefined" && window.location.hostname.includes("localhost")) {
    return "http://localhost:8000" + API_BASE_PATH;
  }

  // Default to production
  return "https://automl.iee.ihu.gr" + API_BASE_PATH;
})();

export const ALLOWED_ALGORITHMS = {
  binary_classification: [
    "Logistic Regression", "Decision Tree", "Random Forest", "XGBoost",
    "LightGBM", "CatBoost", "Neural Network", "Extra Trees", "Nearest Neighbors"
  ],
  multiclass_classification: [
    "Logistic Regression", "Decision Tree", "Random Forest", "XGBoost",
    "LightGBM", "CatBoost", "Neural Network", "Extra Trees"
  ],
  regression: [
    "Linear Regression", "Decision Tree", "Random Forest", "XGBoost",
    "LightGBM", "CatBoost", "Neural Network", "Extra Trees"
  ]
} as const;

export const DEFAULT_HYPERPARAMETERS = {
  "Decision Tree": {
    max_depth: 5,
    min_samples_split: 2
  },
  "Random Forest": {
    n_estimators: 100,
    max_depth: 7
  },
  "XGBoost": {
    n_estimators: 100,
    learning_rate: 0.1,
    max_depth: 6
  },
  "LightGBM": {
    n_estimators: 100,
    learning_rate: 0.1,
    num_leaves: 31,
    max_depth: -1
  },
  "CatBoost": {
    iterations: 100,
    depth: 6,
    learning_rate: 0.1
  },
  "Neural Network": {
    hidden_layer_sizes: [64, 32],
    activation: "relu",
    solver: "adam",
    alpha: 0.0001
  },
  "Extra Trees": {
    n_estimators: 100,
    max_depth: 7,
    min_samples_split: 2
  },
  "Nearest Neighbors": {
    n_neighbors: 5,
    metric: "minkowski",
    weights: "uniform"
  },
  "Linear Regression": {
    fit_intercept: true,
    n_jobs: null
  },
  "Logistic Regression": {
    penalty: "l2",
    C: 1.0,
    solver: "lbfgs",
    max_iter: 100,
    fit_intercept: true,
    class_weight: null
  },
  "Baseline": {}
} as const;

export const generateExperimentName = (prefix: string, identifier: string): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // If identifier is provided, include it, otherwise just use prefix and date
  if (identifier && identifier.trim() !== '') {
    return `${prefix}_${identifier}_${year}_${month}_${day}`;
  } else {
    return `${prefix}_${year}_${month}_${day}`;
  }
};

// Enhanced API URL function with logging
export const getWorkingAPIUrl = async (): Promise<string> => {
  console.log("🌍 API base URL resolved to:", API_BASE_URL);
  return API_BASE_URL;
};
