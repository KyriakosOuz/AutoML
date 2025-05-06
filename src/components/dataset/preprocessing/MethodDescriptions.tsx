
// Method descriptions for tooltips based on the provided specifications
export interface MethodInfo {
  name: string;
  description: string;
  requiresNumerical: boolean;
  requiresMixed: boolean;
  tooltip: string;
}

export const methodDescriptions: Record<string, MethodInfo> = {
  // Undersampling methods
  random_under: {
    name: 'Random Undersampling',
    description: 'Randomly removes samples from majority classes until classes are balanced.',
    requiresNumerical: false,
    requiresMixed: false,
    tooltip: "Works with any data type by randomly duplicating or removing samples."
  },
  enn: {
    name: 'Edited Nearest Neighbors',
    description: 'Removes majority samples whose class differs from the class of their nearest neighbors.',
    requiresNumerical: true,
    requiresMixed: false,
    tooltip: "Removes ambiguous samples using nearest neighbors. Requires numerical features."
  },
  tomek: {
    name: 'Tomek Links',
    description: 'Identifies and removes majority samples that form "Tomek links" (pairs of closest samples from different classes).',
    requiresNumerical: true,
    requiresMixed: false,
    tooltip: "Removes overlapping samples. Requires numerical features."
  },
  ncr: {
    name: 'Neighborhood Cleaning Rule',
    description: 'Combines ENN with additional cleaning rules to remove more majority samples.',
    requiresNumerical: true,
    requiresMixed: false,
    tooltip: "Cleans noisy data by removing mislabeled examples. Requires numerical features."
  },
  
  // Oversampling methods
  random_over: {
    name: 'Random Oversampling',
    description: 'Creates exact duplicates of minority class samples.',
    requiresNumerical: false,
    requiresMixed: false,
    tooltip: "Works with any data type by randomly duplicating or removing samples."
  },
  smote: {
    name: 'SMOTE',
    description: 'Creates synthetic samples along the line segments joining minority class neighbors.',
    requiresNumerical: true,
    requiresMixed: false,
    tooltip: "Requires numerical features. Creates synthetic samples using distance-based interpolation."
  },
  borderline_smote: {
    name: 'Borderline SMOTE',
    description: 'Creates synthetic samples specifically for minority samples near the class boundary.',
    requiresNumerical: true,
    requiresMixed: false,
    tooltip: "Like SMOTE, but focuses on borderline examples. Requires numerical features."
  },
  adasyn: {
    name: 'ADASYN',
    description: 'Generates more synthetic samples for minority instances that are harder to learn.',
    requiresNumerical: true,
    requiresMixed: false,
    tooltip: "Generates more synthetic data for harder examples. Requires numerical features."
  },
  smotenc: {
    name: 'SMOTENC',
    description: 'SMOTE adaptation for datasets with mixed numerical and categorical features.',
    requiresNumerical: true,
    requiresMixed: true,
    tooltip: "Handles both numerical and categorical features. Use only if dataset is mixed."
  },
};
