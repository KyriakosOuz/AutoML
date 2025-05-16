import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
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
  Image,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet
} from 'lucide-react';
import { ExperimentResults, PerClassMetric } from '@/types/training';
import { ExperimentStatus } from '@/contexts/training/types';
import { formatTrainingTime } from '@/utils/formatUtils';
import { formatDateForGreece } from '@/lib/dateUtils';
import CSVPreview from './CSVPreview';
import { downloadFile, downloadJSON } from '../training/prediction/utils/downloadUtils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MLJARExperimentResultsProps {
  experimentId: string | null;
  status: ExperimentStatus;
  experimentResults: ExperimentResults | null;
  isLoading: boolean;
  error: string | null;
  onReset?: () => void;
  onRefresh?: () => void;
}

// Helper function to format task type
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
  } else if (fileType.includes('true_vs_predicted')) {
    return 'True vs Predicted';
  } else if (fileType.includes('predicted_vs_residuals')) {
    return 'Predicted vs Residuals';
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
  const [perClassMetricsOpen, setPerClassMetricsOpen] = useState(false);
  const [showAllLeaderboardRows, setShowAllLeaderboardRows] = useState(false);
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [isLoadingReadme, setIsLoadingReadme] = useState(false);
  
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
  
  // Helper to get per-class metrics from either legacy or new format
  const getPerClassMetrics = (): Record<string, PerClassMetric> | undefined => {
    if (!experimentResults) return undefined;
    
    // Check for the new format (metrics.per_class)
    if (experimentResults.metrics?.per_class && 
        Object.keys(experimentResults.metrics.per_class).length > 0) {
      return experimentResults.metrics.per_class;
    }
    
    // Fallback to legacy format
    if (experimentResults.per_class_metrics && 
        Object.keys(experimentResults.per_class_metrics).length > 0) {
      return experimentResults.per_class_metrics;
    }
    
    return undefined;
  };
  
  // Helper to get F1-score regardless of format ('f1-score' or 'f1_score')
  const getF1Score = (metrics: any): number | undefined => {
    if (metrics && typeof metrics === 'object') {
      return metrics['f1-score'] !== undefined ? 
        metrics['f1-score'] : 
        metrics.f1_score;
    }
    return undefined;
  };
  
  // New function to handle JSON metadata download
  const handleMetadataDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }
      const jsonData = await response.json();
      downloadJSON(jsonData, 'model_metadata.json');
    } catch (error) {
      console.error('Error downloading model metadata:', error);
      // Fall back to direct download if fetch fails
      downloadFile(url, 'model_metadata.json');
    }
  };
  
  // New function to handle toggling the leaderboard rows display
  const handleToggleLeaderboardRows = () => {
    console.log('Toggling leaderboard rows, current state:', showAllLeaderboardRows);
    setShowAllLeaderboardRows(prevState => !prevState);
    console.log('New state will be:', !showAllLeaderboardRows);
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

  // New function to fetch README content
  const fetchReadmeContent = async (url: string) => {
    try {
      setIsLoadingReadme(true);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch README: ${response.status}`);
      }
      const text = await response.text();
      setReadmeContent(text);
    } catch (error) {
      console.error('Error fetching README:', error);
      setReadmeContent('Error loading README content');
    } finally {
      setIsLoadingReadme(false);
    }
  };

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
    automl_engine,
    model_display_name,
    model_file_url
  } = experimentResults;

  // Use model_display_name as the primary source for best model label
  const bestModelLabel = model_display_name || 
                        metrics.best_model_label || 
                        (hyperparameters.best_model ? hyperparameters.best_model : 'Not specified');

  // Get primary metric based on task type
  const getPrimaryMetric = () => {
    if (task_type?.includes('classification')) {
      return {
        name: metrics.metric_used || 'logloss',
        value: metrics.metric_value || (metrics.logloss || metrics.f1_score || metrics.accuracy || metrics.f1)
      };
    } else {
      return {
        name: metrics.metric_used || 'rmse',
        value: metrics.metric_value || (metrics.rmse || metrics.mse || metrics.mae || metrics.r2_score)
      };
    }
  };

  const primaryMetric = getPrimaryMetric();
  
  // Filter files by type - expanded to include regression visualizations
  const getFilesByType = (fileType: string) => {
    return files.filter(file => file.file_type === fileType || file.file_type.includes(fileType));
  };

  const visualizationFiles = [
    ...getFilesByType('confusion_matrix'),
    ...getFilesByType('roc_curve'),
    ...getFilesByType('evaluation_curve'),
    ...getFilesByType('precision_recall_curve'),
    ...getFilesByType('learning_curve'),
    ...getFilesByType('feature_importance'),
    ...getFilesByType('true_vs_predicted'),
    ...getFilesByType('predicted_vs_residuals')
  ];

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
  
  // Updated to prioritize model_file_url from experimentResults
  // If not available, fall back to the existing method of searching through files
  const getModelFileUrl = () => {
    if (model_file_url) {
      console.log('[MLJARExperimentResults] Using model_file_url:', model_file_url);
      return model_file_url;
    }
    
    // Fallback: find the model file in the files array
    const modelFile = files.find(file => 
      file.file_type === 'model' || 
      file.file_type.includes('model') ||
      file.file_name?.includes('.pkl')
    );
    
    console.log('[MLJARExperimentResults] Using fallback model file:', modelFile);
    return modelFile?.file_url;
  };
  
  // Get the model download URL
  const modelDownloadUrl = getModelFileUrl();
  
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
  
  // Format created_at date for display
  const formattedCreatedAt = created_at ? formatDateForGreece(new Date(created_at), 'PP p') : 'N/A';
  const formattedCompletedAt = completed_at ? formatDateForGreece(new Date(completed_at), 'PP p') : 'N/A';

  // Get the leaderboard file
  const leaderboardFile = files.find(file => 
    file.file_type === 'leaderboard_csv' ||
    file.file_type.includes('leaderboard')
  );

  // Helper to render per-class metrics if present - Updated to handle both formats
  const renderPerClassMetrics = () => {
    const perClassMetrics = getPerClassMetrics();
    
    if (!perClassMetrics || Object.keys(perClassMetrics).length === 0) {
      return null;
    }

    return (
      <Collapsible 
        open={perClassMetricsOpen} 
        onOpenChange={setPerClassMetricsOpen}
        className="mt-6 border rounded-md overflow-hidden"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 text-left">
          <span className="font-medium">Per-Class Metrics</span>
          {perClassMetricsOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4">
            <ResponsiveTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Precision</TableHead>
                  <TableHead>Recall</TableHead>
                  <TableHead>F1-Score</TableHead>
                  <TableHead>Support</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(perClassMetrics).map(([classLabel, metrics]) => (
                  <TableRow key={classLabel}>
                    <TableCell>{classLabel}</TableCell>
                    <TableCell>
                      {metrics.precision !== undefined 
                        ? formatMetricValue(metrics.precision, true) 
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {metrics.recall !== undefined 
                        ? formatMetricValue(metrics.recall, true) 
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getF1Score(metrics) !== undefined 
                        ? formatMetricValue(getF1Score(metrics), true) 
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {metrics.support !== undefined 
                        ? metrics.support 
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ResponsiveTable>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Card className="w-full mt-6 border border-primary/20 rounded-lg shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">
              {model_display_name || experiment_name || 'MLJAR Experiment Results'}
            </CardTitle>
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
          
          {/* Show created_at date instead of Training time */}
          <span className="inline-flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Created: <span className="font-semibold ml-1">{formattedCreatedAt}</span>
          </span>
          
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                      
                      {/* Replace Training Time: N/A with Created At date */}
                      <span className="text-sm text-muted-foreground">Created At:</span>
                      <span className="text-sm font-medium">{formattedCreatedAt}</span>
                      
                      {automl_engine && (
                        <>
                          <span className="text-sm text-muted-foreground">Engine:</span>
                          <span className="text-sm font-medium">{automl_engine.toUpperCase()}</span>
                        </>
                      )}
                      
                      {completed_at && (
                        <>
                          <span className="text-sm text-muted-foreground">Completed:</span>
                          <span className="text-sm font-medium">{formattedCompletedAt}</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-center">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {primaryMetric.name
                          .replace(/_/g, ' ')
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')}
                      </h3>
                      <p className="text-3xl font-bold text-primary">
                        {formatMetric(primaryMetric.value)}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {Object.entries(metrics).map(([key, value]) => {
                        if (
                          key === 'best_model_label' ||
                          key === 'metric_used' ||
                          key === 'metric_value' ||
                          key === 'classification_report' ||
                          key === 'confusion_matrix' ||
                          key === 'source' ||
                          key === 'per_class' || // Skip the per_class object here
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
                          <div key={key} className="p-3 bg-muted/40 rounded-md">
                            <span className="block text-sm text-muted-foreground">
                              {metricDisplayName}
                            </span>
                            <span className="text-lg font-medium">
                              {formatMetricValue(value as number, isPercent)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Add the Per-Class Metrics collapsible section */}
                    {renderPerClassMetrics()}
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
                    Preview of predictions made by the MLJAR model
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CSVPreview
                    fileUrl={predictionsFile.file_url}
                    downloadUrl={predictionsFile.file_url}
                    maxRows={10}
                    engineName={automl_engine?.toUpperCase()}
                  />
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
          
          {/* Model Details Tab */}
          <TabsContent value="metadata" className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              {/* Model File Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-center">Model File</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-2">
                  {modelDownloadUrl ? (
                    <Button asChild>
                      <a href={modelDownloadUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download Model
                      </a>
                    </Button>
                  ) : (
                    <Button disabled variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Not Available
                    </Button>
                  )}
                </CardContent>
              </Card>
              
              {/* Model Metadata Card - UPDATED to use handleMetadataDownload */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-center">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-2">
                  {modelMetadataFile ? (
                    <Button 
                      variant="outline" 
                      onClick={() => handleMetadataDownload(modelMetadataFile.file_url)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download JSON
                    </Button>
                  ) : (
                    <Button disabled variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Not Available
                    </Button>
                  )}
                </CardContent>
              </Card>
              
              {/* Documentation Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-center">Documentation</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-2">
                  {readmeFile ? (
                    <Dialog open={readmePreviewOpen} onOpenChange={setReadmePreviewOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          onClick={() => fetchReadmeContent(readmeFile.file_url)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Readme
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>README Documentation</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                          {isLoadingReadme ? (
                            <div className="flex justify-center py-8">
                              <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                          ) : (
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <pre className="whitespace-pre-wrap font-mono text-xs p-4 rounded-md overflow-auto bg-muted">
                                {readmeContent}
                              </pre>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button disabled variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Not Available
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* New Leaderboard Card */}
            {leaderboardFile && (
              <Card className="shadow-sm mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Model Leaderboard</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => downloadFile(leaderboardFile.file_url, 'model_leaderboard.csv')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </Button>
                  </div>
                  <CardDescription>
                    View models evaluated during experiment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CSVPreview
                    fileUrl={leaderboardFile.file_url}
                    downloadUrl={leaderboardFile.file_url}
                    maxRows={showAllLeaderboardRows ? undefined : 10}
                    engineName={automl_engine?.toUpperCase()}
                  />
                  <div className="flex justify-center mt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleToggleLeaderboardRows}
                    >
                      {showAllLeaderboardRows ? (
                        <>Show Less</>
                      ) : (
                        <>Show All</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Add some simple info below the cards if needed */}
            {automl_engine && (
              <div className="mt-6 text-center text-sm text-muted-foreground">
                This model was trained using {automl_engine.toUpperCase()} AutoML engine
                {training_time_sec && ` in ${formatTrainingTime(training_time_sec)}`}
              </div>
            )}
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
            {formattedCompletedAt}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default MLJARExperimentResults;
