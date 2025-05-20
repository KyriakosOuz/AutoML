
import React from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExperimentResults } from '@/types/training';
import { Download, ImageIcon } from 'lucide-react';
import { filterVisualizationFiles } from '@/utils/visualizationFilters';

interface VisualizationDisplayProps {
  results: ExperimentResults;
}

const VisualizationDisplay: React.FC<VisualizationDisplayProps> = ({ results }) => {
  const files = results?.files || [];
  
  // Use the shared utility function to filter visualization files
  const visualizationFiles = filterVisualizationFiles(files);

  // Log which visualizations were found
  console.log("[VisualizationDisplay] Found visualization files:", 
    visualizationFiles.map(f => ({ 
      type: f.file_type, 
      name: f.file_name,
      url: f.file_url,
      curve_subtype: f.curve_subtype
    }))
  );

  if (visualizationFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Visualizations Available</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No visualizations were found for this experiment.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {visualizationFiles.map((file, index) => (
        <Dialog key={index}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="aspect-video bg-muted flex items-center justify-center rounded-md relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${file.file_url})` }}
                  />
                  <div className="absolute inset-0 bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors" />
                </div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium capitalize">
                    {formatVisualizationName(file.file_type, file.file_name, file.curve_subtype)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogTitle className="sr-only">
              {formatVisualizationName(file.file_type, file.file_name, file.curve_subtype)}
            </DialogTitle>
            <div className="p-1">
              <img 
                src={file.file_url} 
                alt={formatVisualizationName(file.file_type, file.file_name, file.curve_subtype)}
                className="w-full rounded-md"
              />
              <div className="mt-2 flex justify-between items-center">
                <h3 className="font-medium capitalize">
                  {formatVisualizationName(file.file_type, file.file_name, file.curve_subtype)}
                </h3>
                <Button variant="outline" size="sm" asChild>
                  <a href={file.file_url} download={file.file_name || `${file.file_type}.png`} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
};

// Enhanced helper function to format visualization names in a user-friendly way
const formatVisualizationName = (fileType?: string, fileName?: string, curveSubtype?: string): string => {
  // First check for curve subtype for special visualization types
  if (curveSubtype) {
    if (curveSubtype === 'roc') {
      return 'ROC Curve';
    }
    if (curveSubtype === 'precision_recall') {
      return 'Precision-Recall Curve';
    }
    if (curveSubtype === 'calibration') {
      return 'Calibration Curve';
    }
    if (curveSubtype === 'learning') {
      return 'Learning Curve';
    }
  }

  // Then check if we have a specific file name to determine the visualization type
  if (fileName) {
    if (fileName.includes('learning_curve') || fileName.includes('learning_curves')) {
      return 'Learning Curve';
    }
    if (fileName.includes('roc_curve')) {
      return 'ROC Curve';
    }
    if (fileName.includes('precision_recall_curve') || fileName.includes('precision_recall')) {
      return 'Precision-Recall Curve';
    }
  }
  
  // Otherwise use the file type
  if (!fileType) return 'Visualization';
  
  if (fileType.includes('confusion_matrix')) {
    return fileType.includes('normalized') ? 'Normalized Confusion Matrix' : 'Confusion Matrix';
  } else if (fileType.includes('roc_curve') || fileType.includes('evaluation_curve')) {
    // Check if this is a precision-recall curve first
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
  } else if (fileType.includes('calibration_curve')) {
    return 'Calibration Curve';
  } else if (fileType.includes('ks_statistic')) {
    return 'KS Statistic';
  } else if (fileType.includes('lift_curve')) {
    return 'Lift Curve';
  } else if (fileType.includes('cumulative_gains')) {
    return 'Cumulative Gains Curve';
  } else if (fileType.includes('pdp_')) {
    // Parse PDP plot names to show feature and class
    const parts = fileType.replace('pdp_', '').split('_');
    if (parts.length >= 2) {
      const feature = parts[0];
      const className = parts.slice(1).join(' ');
      return `PDP: ${feature} - ${className}`;
    }
    return 'Partial Dependence Plot';
  } else if (fileType.includes('ice_')) {
    // Parse ICE plot names to show feature and class
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

export default VisualizationDisplay;
