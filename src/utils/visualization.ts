
import { TrainingFile } from '@/types/training';

export const filterVisualizationFiles = (files: TrainingFile[]) => {
  return files.filter(file => {
    const ext = file.file_url?.toLowerCase();
    const type = file.file_type?.toLowerCase();
    const name = file.file_name?.toLowerCase();

    const includeIf = [
      'confusion_matrix', 'evaluation_curve', 'roc_curve', 'precision_recall',
      'learning_curve', 'shap', 'distribution', 'pdp', 'ice', 'importance',
      'true_vs_predicted', 'residual', 'visualization', 'chart', 'graph'
    ];
    
    const excludeIf = [
      'model', 'csv', 'readme', 'metadata', 'leaderboard'
    ];

    return (
      ext?.endsWith('.png') &&
      includeIf.some(s => type?.includes(s) || name?.includes(s)) &&
      !excludeIf.some(s => type?.includes(s) || name?.includes(s))
    );
  });
};

export const formatVisualizationName = (fileType: string): string => {
  if (fileType.includes('confusion_matrix')) {
    return fileType.includes('normalized') ? 'Normalized Confusion Matrix' : 'Confusion Matrix';
  } else if (fileType.includes('roc_curve') || fileType.includes('evaluation_curve')) {
    if (fileType.includes('precision_recall')) {
      return 'Precision-Recall Curve';
    }
    return 'ROC Curve';
  } else if (fileType.includes('precision_recall')) {
    return 'Precision-Recall Curve';
  } else if (fileType.includes('learning_curve')) {
    return 'Learning Curve';
  } else if (fileType.includes('feature_importance') || fileType.includes('importance')) {
    return 'Feature Importance';
  } else if (fileType.includes('true_vs_predicted')) {
    return 'True vs Predicted';
  } else if (fileType.includes('predicted_vs_residuals') || fileType.includes('residual_analysis')) {
    return 'Residual Analysis';
  } else if (fileType.includes('pdp_')) {
    const parts = fileType.replace('pdp_', '').split('_');
    if (parts.length >= 2) {
      const feature = parts[0];
      const className = parts.slice(1).join(' ');
      return `PDP: ${feature} - ${className}`;
    }
    return 'Partial Dependence Plot';
  } else if (fileType.includes('ice_')) {
    const parts = fileType.replace('ice_', '').split('_');
    if (parts.length >= 2) {
      const feature = parts[0];
      const className = parts.slice(1).join(' ');
      return `ICE: ${feature} - ${className}`;
    }
    return 'Individual Conditional Expectation';
  }
  
  return fileType.replace(/_/g, ' ');
};
