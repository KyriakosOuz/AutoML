import React, { useEffect, useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { ExperimentResults } from '@/types/training';
import { getExperimentResults } from '@/lib/training';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Download, FileText, Table as TableIcon } from 'lucide-react';
import { formatDateForGreece } from '@/lib/dateUtils';
import { formatTrainingTime } from '@/utils/formatUtils';
import CSVPreview from '../results/CSVPreview';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CopyButton } from '../ui/copy-button';

interface ExperimentDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  experimentId: string | null;
  onViewResults?: () => void;
}

export const ExperimentDetailDrawer: React.FC<ExperimentDetailDrawerProps> = ({
  open,
  onClose,
  experimentId,
  onViewResults
}) => {
  const [results, setResults] = useState<ExperimentResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!experimentId) {
      setResults(null);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getExperimentResults(experimentId);
        setResults(data);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch experiment results');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [experimentId]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // Function to format visualization name
  const formatVisualizationName = (fileName: string) => {
    if (fileName.includes('confusion_matrix')) {
      return fileName.includes('normalized') ? 'Normalized Confusion Matrix' : 'Confusion Matrix';
    } else if (fileName.includes('roc_curve')) {
      return 'ROC Curve';
    } else if (fileName.includes('precision_recall')) {
      return 'Precision-Recall Curve';
    } else if (fileName.includes('feature_importance')) {
      return 'Feature Importance';
    } else if (fileName.includes('learning_curve')) {
      return 'Learning Curve';
    } else if (fileName.includes('true_vs_predicted')) {
      return 'True vs Predicted';
    } else if (fileName.includes('predicted_vs_residuals')) {
      return 'Predicted vs Residuals';
    } else {
      // Default case: Format to Title Case
      return fileName
        .replace(/\.[^/.]+$/, '') // Remove file extension
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  };

  const handleViewResults = () => {
    if (onViewResults) {
      onViewResults();
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Experiment Details</DrawerTitle>
          <DrawerDescription>
            {experimentId ? `Details for experiment ID: ${experimentId}` : 'No experiment selected.'}
            <CopyButton text={experimentId || ''} />
          </DrawerDescription>
        </DrawerHeader>
        
        {isLoading && <p>Loading experiment details...</p>}
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        
        {results && (
          <div className="space-y-8">
            
            <Card>
              <CardHeader>
                <CardTitle>Experiment Information</CardTitle>
                <CardDescription>Details about the experiment setup</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex justify-between">
                  <span>Experiment Name:</span>
                  <span>{results.experiment_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Task Type:</span>
                  <span>{results.task_type || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Column:</span>
                  <span>{results.target_column || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Engine:</span>
                  <span>{results.automl_engine || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created At:</span>
                  <span>{formatDateForGreece(new Date(results.created_at), 'PP p') || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed At:</span>
                  <span>{formatDateForGreece(new Date(results.completed_at), 'PP p') || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Training Time:</span>
                  <span>{formatTrainingTime(results.training_time_sec) || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Metrics</CardTitle>
                <CardDescription>Performance metrics from the experiment</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {Object.entries(results.metrics || {}).map(([key, value]) => {
                  // Skip source and other non-display metrics
                  if (key === 'source' || typeof value === 'object') {
                    return null;
                  }
                  
                  // Format the key for display
                  const formattedKey = key.toUpperCase() === 'R2' 
                    ? 'R²' 
                    : key.toUpperCase() === 'MSE'
                    ? 'MSE'
                    : key.toUpperCase() === 'RMSE'
                    ? 'RMSE'
                    : key.toUpperCase() === 'MAE'
                    ? 'MAE'
                    : key.toUpperCase() === 'MAPE'
                    ? 'MAPE'
                    : key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                  
                  return (
                    <div className="flex justify-between" key={key}>
                      <span>{formattedKey}:</span>
                      <span>{typeof value === 'number' ? value.toFixed(4) : String(value)}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            
            {/* Visualizations Section */}
            {results.files && results.files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Visualizations</CardTitle>
                  <CardDescription>Visual representations of model performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results.files.filter(file => 
                      file.file_type === 'confusion_matrix' ||
                      file.file_type === 'roc_curve' ||
                      file.file_type.includes('evaluation_curve') ||
                      file.file_type.includes('precision_recall') ||
                      file.file_type === 'feature_importance' ||
                      file.file_type.includes('learning_curve') ||
                      file.file_type.includes('true_vs_predicted') ||
                      file.file_type.includes('predicted_vs_residuals')
                    ).map((file, idx) => (
                      <Dialog key={idx}>
                        <DialogTrigger asChild>
                          <Card className="overflow-hidden cursor-pointer hover:border-primary/50 transition-all">
                            <CardHeader className="p-3">
                              <CardTitle className="text-sm">{formatVisualizationName(file.file_type)}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="h-36 bg-muted relative">
                                <img
                                  src={file.file_url}
                                  alt={file.file_type}
                                  className="absolute inset-0 w-full h-full object-contain"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>{formatVisualizationName(file.file_type)}</DialogTitle>
                          </DialogHeader>
                          <img
                            src={file.file_url}
                            alt={file.file_type}
                            className="w-full rounded-md"
                          />
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Model File Section */}
            {results.files && results.files.find(file => file.file_type === 'model') && (
              <Card>
                <CardHeader>
                  <CardTitle>Model File</CardTitle>
                  <CardDescription>Download the trained model</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <a href={results.files.find(file => file.file_type === 'model')?.file_url} download>
                      <Download className="h-4 w-4 mr-2" />
                      Download Model
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Predictions File Section */}
            {results.files && results.files.find(file => file.file_type === 'predictions_csv') && (
              <Card>
                <CardHeader>
                  <CardTitle>Predictions</CardTitle>
                  <CardDescription>Preview of the predictions</CardDescription>
                </CardHeader>
                <CardContent>
                  <CSVPreview
                    fileUrl={results.files.find(file => file.file_type === 'predictions_csv')?.file_url || ''}
                    maxRows={5}
                    engineName={results.automl_engine || 'N/A'}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={handleOpenChange.bind(null, false)}>
            Close
          </Button>
          {results && (
            <Button className="ml-2" onClick={handleViewResults}>
              View Full Results
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
