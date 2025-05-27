
import { ExperimentResults } from '@/types/training';

export interface TrainingFile {
  file_id: string;
  file_type: string;
  file_url: string;
  file_name?: string;
  created_at: string;
  curve_subtype?: string;
}

export const filterVisualizationFiles = (files: TrainingFile[]): TrainingFile[] => {
  return files.filter(file => {
    const type = file.file_type?.toLowerCase();
    const name = file.file_name?.toLowerCase() || '';
    const url = file.file_url?.toLowerCase() || '';

    // Include visualization file types
    const includeTypes = [
      'confusion_matrix',
      'evaluation_curve', 
      'learning_curve',
      'roc_curve',
      'precision_recall',
      'shap',
      'distribution',
      'pdp',
      'ice',
      'importance',
      'true_vs_predicted',
      'residual',
      'visualization',
      'chart',
      'graph'
    ];
    
    // Exclude non-visualization file types
    const excludeTypes = [
      'model',
      'csv',
      'readme',
      'metadata',
      'leaderboard'
    ];

    const isIncluded = includeTypes.some(includeType => 
      type?.includes(includeType) || name.includes(includeType)
    );
    
    const isExcluded = excludeTypes.some(excludeType => 
      type?.includes(excludeType) || name.includes(excludeType)
    );

    // Must be a PNG file and included type but not excluded
    return url.endsWith('.png') && isIncluded && !isExcluded;
  });
};

export const formatVisualizationName = (file: TrainingFile): string => {
  const fileType = file.file_type?.toLowerCase() || '';
  const curveSubtype = file.curve_subtype?.toLowerCase();

  // Handle evaluation curves with subtypes
  if (fileType === 'evaluation_curve') {
    if (curveSubtype === 'roc') {
      return 'ROC Curve';
    } else if (curveSubtype === 'precision_recall') {
      return 'Precision-Recall Curve';
    }
    return 'Evaluation Curve';
  }

  // Handle learning curves with subtypes
  if (fileType === 'learning_curve') {
    if (curveSubtype === 'learning') {
      return 'Learning Curve';
    }
    return 'Learning Curve';
  }

  // Handle confusion matrix variations
  if (fileType === 'confusion_matrix') {
    if (file.file_url?.includes('normalized') || file.file_name?.includes('normalized')) {
      return 'Normalized Confusion Matrix';
    }
    return 'Confusion Matrix';
  }

  // Handle other specific types
  const typeMap: Record<string, string> = {
    'roc_curve': 'ROC Curve',
    'precision_recall': 'Precision-Recall Curve',
    'feature_importance': 'Feature Importance',
    'shap': 'SHAP Values',
    'distribution': 'Data Distribution',
    'true_vs_predicted': 'True vs Predicted',
    'residual': 'Residual Analysis'
  };

  // Check for mapped types
  for (const [key, value] of Object.entries(typeMap)) {
    if (fileType.includes(key)) {
      return value;
    }
  }

  // Handle PDP and ICE plots
  if (fileType.includes('pdp_')) {
    const parts = fileType.replace('pdp_', '').split('_');
    if (parts.length >= 2) {
      const feature = parts[0];
      const className = parts.slice(1).join(' ');
      return `PDP: ${feature} - ${className}`;
    }
    return 'Partial Dependence Plot';
  }

  if (fileType.includes('ice_')) {
    const parts = fileType.replace('ice_', '').split('_');
    if (parts.length >= 2) {
      const feature = parts[0];
      const className = parts.slice(1).join(' ');
      return `ICE: ${feature} - ${className}`;
    }
    return 'Individual Conditional Expectation';
  }

  // Default: capitalize and replace underscores
  return fileType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const groupVisualizationsByType = (files: TrainingFile[]) => {
  return {
    confusionMatrices: files.filter(f => f.file_type === 'confusion_matrix'),
    evaluationCurves: files.filter(f => f.file_type === 'evaluation_curve'),
    learningCurves: files.filter(f => f.file_type === 'learning_curve'),
    other: files.filter(f => 
      !['confusion_matrix', 'evaluation_curve', 'learning_curve'].includes(f.file_type)
    )
  };
};
