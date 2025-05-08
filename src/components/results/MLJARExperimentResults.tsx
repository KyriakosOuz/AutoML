import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Award, 
  BarChart4, 
  Clock, 
  Download, 
  FileText, 
  RefreshCw, 
  Table as TableIcon,
  Info,
  Loader,
  Image
} from 'lucide-react';
import { ExperimentResults } from '@/types/training';
import { ExperimentStatus } from '@/contexts/training/types';

interface MLJARExperimentResultsProps {
  experimentId: string | null;
  status: ExperimentStatus;
  experimentResults: ExperimentResults | null;
  isLoading: boolean;
  error: string | null;
  onReset?: () => void;
  onRefresh?: () => void;
}

const formatTaskType = (type: string = '') => {
  if (!type) return "Unknown";
  
  switch (type) {
    case 'binary_classification':
      return 'Binary Classification';
    case 'multiclass_classification':
      return 'Multiclass Classification';
    case 'regression':
      return 'Regression';
    default:
      return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
};

// Enhanced helper function to format visualization names for MLJAR
const formatVisualizationName = (fileType: string): string => {
  if (fileType.includes('confusion_matrix')) {
    return fileType.includes('normalized') ? 'Normalized Confusion Matrix' : 'Confusion Matrix';
  } else if (fileType.includes('roc_curve') || fileType.includes('evaluation_curve')) {
    return 'ROC Curve';
  } else if (fileType.includes('precision_recall')) {
    return 'Precision-Recall Curve';
  } else if (fileType.includes('learning_curve')) {
    return 'Learning Curve';
  } else if (fileType.includes('feature_importance')) {
    return 'Feature Importance';
  }
  
  // Default formatting: capitalize each word and replace underscores with spaces
  return fileType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const MLJARExperimentResults: React.FC<MLJARExperimentResultsProps> = ({
  experimentId,
  status,
  experimentResults,
  isLoading,
  error,
  onReset,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [predictionsDialogOpen, setPredictionsDialogOpen] = useState(false);
  const [readmePreviewOpen, setReadmePreviewOpen] = useState(false);
  
  // Format metric for display
  const formatMetricValue = (value: number | undefined, isPercentage: boolean = true) => {
    if (value === undefined) return 'N/A';
    if (isPercentage) {
      return `${(value * 100).toFixed(2)}%`;
    }
    return value.toFixed(4);
  };
  
  // Helper function to determine if metric should be shown as percentage
  const isPercentageMetric = (metricName: string): boolean => {
    return ['accuracy', 'f1', 'precision', 'recall', 'auc'].some(m => 
      metricName.toLowerCase().includes(m)
    );
  };
  
  if (isLoading || status === 'processing' || status === 'running') {
    return (
      <Card className="w-full mt-6 rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Award className="h-5 w-5 mr-2 text-primary" />
            Loading MLJAR Results
          </CardTitle>
          <CardDescription>
            Fetching your experiment results...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin">
              <Loader className="h-12 w-12 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Loading MLJAR experiment data...
            </p>
            {experimentId && (
              <p className="text-xs font-mono text-muted-foreground">
                Experiment ID: {experimentId}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || status === 'failed') {
    const errorMessage = experimentResults?.error_message || error;
    
    return (
      <Card className="w-full mt-6 rounded-lg shadow-md border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <Alert className="h-5 w-5 mr-2" />
            Error Loading Results
          </CardTitle>
          <CardDescription>
            There was a problem with your MLJAR experiment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          <div className="flex space-x-2 mt-4">
            {onReset && (
              <Button 
                variant="outline" 
                onClick={onReset}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            {onRefresh && (
              <Button 
                variant="secondary" 
                onClick={onRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!experimentResults) {
    return (
      <Card className="w-full mt-6 rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Award className="h-5 w-5 mr-2 text-primary" />
            No MLJAR Results Available
          </CardTitle>
          <CardDescription>
            Select or run an experiment to view results
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <Image className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No experiment data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract relevant information from experiment results
  const {
    experiment_id,
    experiment_name,
    task_type,
    target_column,
    training_time_sec,
    metrics = {},
    files = [],
    created_at,
    completed_at,
    hyperparameters = {},
    automl_engine
  } = experimentResults;

  // Find best model label if available
  const bestModelLabel = metrics.best_model_label || 
    (hyperparameters.best_model ? hyperparameters.best_model : 'Not specified');

  // Get primary metric based on task type
  const getPrimaryMetric = () => {
    if (task_type?.includes('classification')) {
      return {
        name: metrics.metric_used || 'logloss',
        value: metrics.metric_value || (metrics.logloss || metrics.f1 || metrics.accuracy)
      };
    } else {
      return {
        name: metrics.metric_used || 'rmse',
        value: metrics.metric_value || (metrics.rmse || metrics.mse || metrics.mae || metrics.r2_score)
      };
    }
  };

  const primaryMetric = getPrimaryMetric();
  
  // Updated visualization file filtering - exclude readme and predictions
  const getVisualizations = () => {
    return files.filter(file => {
      // Explicitly exclude these file types
      if (file.file_type === 'readme' || 
          file.file_type.includes('README') || 
          file.file_type === 'predictions_csv' ||
          file.file_type.includes('predictions') ||
          file.file_type === 'model' ||
          file.file_type.includes('label_encoder')) {
        return false;
      }
      
      // Include only visualization file types
      return (
        file.file_type.includes('confusion_matrix') ||
        file.file_type.includes('roc_curve') ||
        file.file_type.includes('evaluation_curve') ||
        file.file_type.includes('precision_recall') ||
        file.file_type.includes('learning_curve') ||
        file.file_type.includes('feature_importance')
      );
    });
  };

  const visualizationFiles = getVisualizations();
  
  const modelMetadataFile = files.find(file => 
    file.file_type === 'model_metadata' || 
    file.file_type.includes('ensemble.json')
  );
  
  const readmeFile = files.find(file => 
    file.file_type === 'readme' || 
    file.file_type.includes('README.md')
  );
  
  const predictionsFile = files.find(file => 
    file.file_type === 'predictions_csv' ||
    file.file_type.includes('predictions')
  );

  // Format metric for display
  const formatMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    if (typeof value !== 'number') return String(value);
    
    const isPercentage = ['accuracy', 'f1', 'precision', 'recall', 'auc'].some(
      m => primaryMetric.name.toLowerCase().includes(m)
    );
    
    return isPercentage 
      ? `${(value * 100).toFixed(2)}%` 
      : value.toFixed(4);
  };

  return (
    <Card className="w-full mt-6 border border-primary/20 rounded-lg shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">{experiment_name || 'MLJAR Experiment Results'}</CardTitle>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            Engine: {automl_engine?.toUpperCase() || 'AutoML'}
          </Badge>
        </div>
        
        <CardDescription className="flex flex-wrap gap-x-4 mt-2">
          <span className="inline-flex items-center">
            <BarChart4 className="h-3.5 w-3.5 mr-1" />
            Task: <span className="font-semibold ml-1">{formatTaskType(task_type)}</span>
          </span>
          
          {target_column && (
            <span className="inline-flex items-center">
              <TableIcon className="h-3.5 w-3.5 mr-1" />
              Target: <span className="font-semibold ml-1">{target_column}</span>
            </span>
          )}
          
          {training_time_sec && (
            <span className="inline-flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Time: <span className="font-semibold ml-1">{training_time_sec.toFixed(1)}s</span>
            </span>
          )}
          
          {experiment_id && (
            <span className="inline-flex items-center">
              <span className="font-mono text-xs text-muted-foreground">ID: {experiment_id.substring(0, 8)}</span>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 rounded-none border-b h-12">
            <TabsTrigger value="summary" className="text-sm flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span>Summary</span>
            </TabsTrigger>
            
            <TabsTrigger value="charts" className="text-sm flex items-center gap-1">
              <BarChart4 className="h-4 w-4" />
              <span>Charts</span>
            </TabsTrigger>
            
            <TabsTrigger value="predictions" className="text-sm flex items-center gap-1">
              <TableIcon className="h-4 w-4" />
              <span>Predictions</span>
            </TabsTrigger>
            
            <TabsTrigger value="metadata" className="text-sm flex items-center gap-1">
              <Info className="h-4 w-4" />
              <span>Model Details</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Summary Tab */}
          <TabsContent value="summary" className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Experiment Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm text-muted-foreground">Task Type:</span>
                      <span className="text-sm font-medium">{formatTaskType(task_type)}</span>
                      
                      <span className="text-sm text-muted-foreground">Target Column:</span>
                      <span className="text-sm font-medium">{target_column}</span>
                      
                      <span className="text-sm text-muted-foreground">Best Model:</span>
                      <span className="text-sm font-medium">{bestModelLabel}</span>
                      
                      <span className="text-sm text-muted-foreground">Training Time:</span>
                      <span className="text-sm font-medium">{training_time_sec?.toFixed(2)} seconds</span>
                      
                      {automl_engine && (
                        <>
                          <span className="text-sm text-muted-foreground">Engine:</span>
                          <span className="text-sm font-medium">{automl_engine.toUpperCase()}</span>
                        </>
                      )}
                      
                      {completed_at && (
                        <>
                          <span className="text-sm text-muted-foreground">Completed:</span>
                          <span className="text-sm font-medium">{new Date(completed_at).toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {primaryMetric.name.replace(/_/g, ' ')}
                      </h3>
                      <p className="text-3xl font-bold text-primary">
                        {formatMetric(primaryMetric.value)}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {Object.entries(metrics).map(([key, value]) => {
                        if (
                          key === 'best_model_label' ||
                          key === 'metric_used' ||
                          key === 'metric_value' ||
                          key === 'classification_report' ||
                          key === 'confusion_matrix' ||
                          key === 'source' ||
                          typeof value !== 'number'
                        ) return null;
                        
                        // Enhanced formatting of metric display names
                        const metricDisplayName = key
                          .replace(/_/g, ' ')
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                        
                        const isPercent = isPercentageMetric(key);
                        
                        return (
                          <div key={key}>
                            <span className="text-sm text-muted-foreground">
                              {metricDisplayName}:
                            </span>
                            <span className="text-sm font-medium ml-2">
                              {formatMetricValue(value as number, isPercent)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Charts Tab */}
          <TabsContent value="charts" className="p-6">
            {visualizationFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visualizationFiles.map((file, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <Card className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {formatVisualizationName(file.file_type)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                          <div className="aspect-video bg-muted flex justify-center items-center rounded-md relative overflow-hidden">
                            <div 
                              className="absolute inset-0 bg-cover bg-center"
                              style={{ backgroundImage: `url(${file.file_url})` }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>{formatVisualizationName(file.file_type)}</DialogTitle>
                      </DialogHeader>
                      <div className="p-1">
                        <img 
                          src={file.file_url} 
                          alt={file.file_type} 
                          className="w-full rounded-md"
                        />
                        <div className="mt-4 flex justify-end">
                          <Button variant="outline" size="sm" asChild>
                            <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Download Image
                            </a>
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Charts Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  No visualization files were found for this experiment.
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* Predictions Tab */}
          <TabsContent value="predictions" className="p-6">
            {predictionsFile ? (
              <Card>
                <CardHeader>
                  <CardTitle>Model Predictions</CardTitle>
                  <CardDescription>
                    View predictions made by the MLJAR model
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-4">
                    <Button onClick={() => setPredictionsDialogOpen(true)} className="mb-4">
                      <TableIcon className="h-4 w-4 mr-2" />
                      View Predictions
                    </Button>
                    
                    <p className="text-sm text-muted-foreground">
                      Click to preview the model's predictions on the test dataset
                    </p>
                  </div>
                  
                  <Dialog open={predictionsDialogOpen} onOpenChange={setPredictionsDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Predictions Preview</DialogTitle>
                      </DialogHeader>
                      <div className="overflow-x-auto">
                        {/* Predictions table would be loaded here */}
                        <p className="text-muted-foreground mb-4">
                          Preview of predictions (first 50 rows)
                        </p>
                        <p className="text-sm text-center py-8 text-muted-foreground">
                          To view the full predictions, download the CSV file
                        </p>
                        <div className="flex justify-end mt-4">
                          <Button asChild>
                            <a href={predictionsFile.file_url} download target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Download Full Predictions CSV
                            </a>
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <div className="mt-6">
                    <Button asChild className="w-full">
                      <a href={predictionsFile.file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download Predictions CSV
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12">
                <TableIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Predictions Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Prediction data is not available for this experiment.
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* Metadata Tab */}
          <TabsContent value="metadata" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Engine Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="outline" className="bg-primary/10 px-3 py-1 text-sm">
                      Engine: {automl_engine?.toUpperCase() || 'Not specified'}
                    </Badge>
                    
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Model Type:</span>
                      <span className="font-medium">{bestModelLabel}</span>
                      
                      {Object.entries(hyperparameters).slice(0, 6).map(([key, value]) => (
                        <React.Fragment key={key}>
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-medium truncate">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {modelMetadataFile && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Model Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button asChild>
                      <a href={modelMetadataFile.file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download Model Metadata
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {readmeFile && (
                <Card className="shadow-sm md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Documentation</CardTitle>
                    <CardDescription>Model documentation and usage instructions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setReadmePreviewOpen(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      View Documentation
                    </Button>
                    
                    <Dialog open={readmePreviewOpen} onOpenChange={setReadmePreviewOpen}>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Model Documentation</DialogTitle>
                        </DialogHeader>
                        
                        <div className="mt-4">
                          <iframe
                            src={readmeFile.file_url}
                            className="w-full h-[60vh] border rounded"
                            title="Model Documentation"
                          />
                          
                          <div className="flex justify-end mt-4">
                            <Button asChild variant="outline" size="sm">
                              <a href={readmeFile.file_url} target="_blank" rel="noopener noreferrer">
                                <FileText className="h-4 w-4 mr-2" />
                                Open in New Tab
                              </a>
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <div className="flex gap-2">
          {onReset && (
            <Button variant="outline" onClick={onReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              New Experiment
            </Button>
          )}
          
          {onRefresh && (
            <Button variant="secondary" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
        
        {completed_at && (
          <div className="text-xs text-muted-foreground flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {new Date(completed_at).toLocaleString()}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default MLJARExperimentResults;
