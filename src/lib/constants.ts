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

// Updated to use /api prefix
export const API_BASE_URL = (() => {
  const productionURL = "/api";
  const localURL = "http://localhost:8000/api"; // Added /api prefix to local URL
  
  // First check environment variable (highest priority)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Then try to use the production URL
  if (typeof window !== 'undefined') {
    // Use production URL by default
    return productionURL;
  }

  // Fallback to local URL
  return localURL;
})();

// Updated getWorkingAPIUrl to use /api prefix for both environments
export const getWorkingAPIUrl = async (): Promise<string> => {
  const productionURL = "/api";
  const localURL = "http://localhost:8000/api"; // Added /api prefix to local URL

  // First check environment variable (highest priority)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Try to ping the production URL
  try {
    const controller = new AbortController();
    // Timeout after 3 seconds
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${productionURL}/health-check`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('Using production API URL:', productionURL);
      return productionURL;
    }
  } catch (error) {
    console.warn('Production API unreachable, falling back to local:', error);
  }
  
  console.log('Using local API URL:', localURL);
  return localURL;
};
