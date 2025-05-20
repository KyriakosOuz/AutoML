
import { TrainingFile } from '@/types/training';

/**
 * Filters experiment files to return only visualization files
 * while excluding model files, metadata, readme files, etc.
 */
export const filterVisualizationFiles = (files: TrainingFile[]) => {
  // Early return if files is not an array
  if (!Array.isArray(files)) return [];
  
  const visualTypes = [
    'distribution', 'shap', 'confusion_matrix', 'importance', 'evaluation_curve',
    'plot', 'chart', 'graph', 'visualization', 'roc_curve', 'precision_recall_curve',
    'precision_recall', 'class_distribution', 'variable_importance', 'learning_curve',
    'true_vs_predicted', 'predicted_vs_residuals', 'residual_analysis', 'pdp',
    'ice', 'partial_dependence', 'calibration_curve', 'ks_statistic', 'lift_curve', 'cumulative_gains'
  ];

  const excludeTypes = [
    'model', 'trained_model', 'leaderboard_csv', 'predictions_csv', 'csv',
    'readme', 'documentation', 'model_metadata', 'json', 'manifest', 'metadata'
  ];

  return files.filter(file => {
    // Early return if file doesn't have required properties
    if (!file.file_type && !file.file_name && !file.file_url) return false;
    
    const type = (file.file_type || '').toLowerCase();
    const name = (file.file_name || '').toLowerCase();
    const url = (file.file_url || '').toLowerCase();

    // Strong exclusion first: Check exact matches and specifically exclude readme and model_metadata
    if (excludeTypes.includes(type) || type === 'readme' || type === 'model_metadata') {
      return false;
    }
    
    // Check file extension for non-image files
    if (url.endsWith('.json') || url.endsWith('.md') || url.endsWith('.txt') || url.endsWith('.csv')) {
      return false;
    }
    
    // Check for specific excluded keywords in any field
    if (['readme', 'model_metadata', 'metadata'].some(ex => 
      type.includes(ex) || name.includes(ex) || url.includes(ex))) {
      return false;
    }

    // Check if this is an MLJAR image file (excluding readme and metadata)
    const isMLJARVisualization = url.endsWith('.png') && 
      !url.includes('readme') && 
      !url.includes('metadata');

    // Check if this file type matches any of our visualization types
    const isVisualization = 
      visualTypes.some(visType => type.includes(visType)) || 
      isMLJARVisualization ||
      (file.curve_subtype && ['roc', 'precision_recall', 'calibration', 'learning'].includes(file.curve_subtype));

    // Check if this is an image file
    const isImageFile = url.endsWith('.png') || 
                        url.endsWith('.jpg') || 
                        url.endsWith('.jpeg') || 
                        url.endsWith('.svg');

    // Final decision: is this a visualization image that's not excluded?
    return isVisualization && isImageFile;
  });
};
