
import React from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExperimentResults } from '@/types/training';
import { Download, ImageIcon } from 'lucide-react';

interface VisualizationDisplayProps {
  results: ExperimentResults;
}

const VisualizationDisplay: React.FC<VisualizationDisplayProps> = ({ results }) => {
  const files = results?.files || [];
  
  // Enhanced filtering to capture ALL visualization types
  const visualizationFiles = files.filter(file => {
    const visualTypes = [
      'distribution', 
      'shap', 
      'confusion_matrix', 
      'importance', 
      'evaluation_curve',
      'plot', 
      'chart', 
      'graph', 
      'visualization',
      'roc_curve',
      'precision_recall_curve',
      'precision_recall',
      'class_distribution',
      'variable_importance',
      'learning_curve',
      'true_vs_predicted',
      'predicted_vs_residuals',
      'residual_analysis'  // Added new regression visualization type
    ];
    return visualTypes.some(type => file.file_type.toLowerCase().includes(type));
  });

  // Log which visualizations were found
  console.log("[VisualizationDisplay] Found visualization files:", 
    visualizationFiles.map(f => ({ type: f.file_type, url: f.file_url }))
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
                    {formatVisualizationName(file.file_type)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <div className="p-1">
              <img 
                src={file.file_url} 
                alt={file.file_type} 
                className="w-full rounded-md"
              />
              <div className="mt-2 flex justify-between items-center">
                <h3 className="font-medium capitalize">
                  {formatVisualizationName(file.file_type)}
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
const formatVisualizationName = (fileType: string): string => {
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
  }
  
  return fileType.replace(/_/g, ' ');
};

export default VisualizationDisplay;
