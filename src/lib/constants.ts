
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

export const generateExperimentName = (prefix: string, identifier: string): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${prefix}_${identifier}_${year}_${month}_${day}`;
};
