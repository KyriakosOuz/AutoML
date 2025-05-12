import React, { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
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
  Image,
  AlertTriangle
} from 'lucide-react';
import { ExperimentResults, ExperimentStatus } from '@/types/training';
import { formatTrainingTime } from '@/utils/formatUtils';
import { formatDateForGreece } from '@/lib/dateUtils';
import CSVPreview from './CSVPreview';
import H2OLeaderboardTable from './H2OLeaderboardTable';

interface H2OExperimentResultsProps {
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

// Helper function to format visualization names
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
  } else if (fileType.includes('variable_importance')) {
    return 'Variable Importance';
  } else if (fileType.includes('shap')) {
    return 'SHAP Values';
  } else if (fileType.includes('partial_dependence')) {
    return 'Partial Dependence';
  } else if (fileType.includes('importance')) {
    return 'Feature Importance';
  }
  
  // Default formatting: capitalize each word and replace underscores with spaces
  return fileType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const H2OExperimentResults: React.FC<H2OExperimentResultsProps> = ({
  experimentId,
  status,
  experimentResults,
  isLoading,
  error,
  onReset,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [bestModelFromLeaderboard, setBestModelFromLeaderboard] = useState<string | null>(null);
  
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
  
  // Updated: Process leaderboard data for the H2OLeaderboardTable component
  const leaderboardData = useMemo(() => {
    if (!experimentResults) return [];
    
    console.log('Processing leaderboard data for H2O experiment:', experimentResults.experiment_id);
    
    // FIXED: First check if there's CSV data available
    if (experimentResults.leaderboard_csv) {
      console.log('Using leaderboard_csv data');
      return experimentResults.leaderboard_csv;
    }
    
    // Check if leaderboard is an array with data
    if (Array.isArray(experimentResults.leaderboard) && experimentResults.leaderboard.length > 0) {
      console.log('Using leaderboard array data, length:', experimentResults.leaderboard.length);
      // Format the existing leaderboard data for the table
      return experimentResults.leaderboard.map(model => ({
        model_id: model.name || '',
        name: model.name?.split('_')[0] || '',
        ...model.metrics,
        training_time_sec: model.training_time_sec
      }));
    }
    
    // Check if there's a CSV file with leaderboard data
    const leaderboardFile = experimentResults.files?.find(file => 
      file.file_type === 'leaderboard_csv' || 
      file.file_url?.includes('leaderboard')
    );
    
    if (leaderboardFile?.file_url) {
      console.log('Found leaderboard file URL:', leaderboardFile.file_url);
      // Return the URL so the component can fetch it
      return leaderboardFile.file_url;
    }
    
    console.log('No leaderboard data found');
    return [];
  }, [experimentResults]);
  
  // FIXED: Updated check to properly detect if we have leaderboard data
  const hasLeaderboardData = useMemo(() => {
    if (!experimentResults) return false;
    
    // Check all possible sources of leaderboard data
    return (
      (typeof leaderboardData === 'string' && leaderboardData.length > 0) || // CSV string or URL
      (Array.isArray(leaderboardData) && leaderboardData.length > 0) || // Array data
      (Array.isArray(experimentResults.leaderboard) && experimentResults.leaderboard.length > 0) // Direct leaderboard
    );
  }, [experimentResults, leaderboardData]);
  
  // NEW: Parse best model name from leaderboard data immediately
  const parseBestModelFromLeaderboardData = () => {
    console.log('Parsing best model from leaderboard data on mount');
    
    if (!experimentResults) return;
    
    // Check for leaderboard_csv as string first (most common case)
    if (typeof experimentResults.leaderboard_csv === 'string' && experimentResults.leaderboard_csv.trim()) {
      try {
        // Parse just the first two lines of CSV data (header + first model)
        const lines = experimentResults.leaderboard_csv.trim().split('\n');
        if (lines.length >= 2) { // Need at least header and one data row
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const values = lines[1].split(',').map(v => v.trim().replace(/"/g, ''));
          
          // Find the column index for model_id or name
          const modelIdIndex = headers.findIndex(h => 
            h === 'model_id' || h === 'name' || h === 'algorithm' || h.includes('model')
          );
          
          if (modelIdIndex !== -1 && values[modelIdIndex]) {
            const modelId = values[modelIdIndex];
            const parts = modelId.split('_');
            if (parts.length >= 2) {
              const bestModel = `${parts[0]}_${parts[1]}`;
              console.log('Found best model from CSV:', bestModel);
              setBestModelFromLeaderboard(bestModel);
              return;
            }
          }
        }
      } catch (e) {
        console.error('Error parsing leaderboard CSV for best model:', e);
      }
    }
    
    // If CSV parsing failed, try array data
    if (Array.isArray(experimentResults.leaderboard) && experimentResults.leaderboard.length > 0) {
      const bestModel = experimentResults.leaderboard[0];
      if (bestModel && bestModel.name) {
        const parts = bestModel.name.split('_');
        if (parts.length >= 2) {
          const modelName = `${parts[0]}_${parts[1]}`;
          console.log('Found best model from leaderboard array:', modelName);
          setBestModelFromLeaderboard(modelName);
          return;
        }
      }
    }
    
    // If still no best model, try to use model_display_name
    if (experimentResults.model_display_name) {
      console.log('Using model_display_name as best model:', experimentResults.model_display_name);
      setBestModelFromLeaderboard(experimentResults.model_display_name);
      return;
    }
    
    console.log('Could not find best model from initial data');
  };
  
  // Call the parser on component mount
  useEffect(() => {
    parseBestModelFromLeaderboardData();
  }, [experimentResults]);
  
  // NEW: Handle the best model found from the leaderboard component
  const handleBestModelFound = (modelName: string) => {
    console.log("Best model found in leaderboard component:", modelName);
    // Only update if different to avoid unnecessary re-renders
    if (modelName !== bestModelFromLeaderboard) {
      setBestModelFromLeaderboard(modelName);
    }
  };
  
  if (isLoading || status === 'processing' || status === 'running') {
    return (
      <Card className="w-full mt-6 rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Award className="h-5 w-5 mr-2 text-primary" />
            Loading H2O Results
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
              Loading H2O experiment data...
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
            <AlertTriangle className="h-5 w-5 mr-2" />
            Error Loading Results
          </CardTitle>
          <CardDescription>
            There was a problem with your H2O experiment
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
            No H2O Results Available
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
    experiment_name,
    task_type,
    target_column,
    metrics = {},
    files = [],
    created_at,
    completed_at,
    automl_engine,
    model_display_name
  } = experimentResults;

  // Get leaderboard if available
  const leaderboard = experimentResults.leaderboard || [];
  
  // Get best model details
  const bestModelDetails = leaderboard.length > 0 ? leaderboard[0] : null;
  
  // Enhanced: Get the model name and trim it to the first two parts (e.g., "DRF_1")
  // Modified to prioritize the pre-parsed bestModelFromLeaderboard
  const getShortModelName = () => {
    // First priority - Use pre-parsed bestModelFromLeaderboard
    if (bestModelFromLeaderboard) {
      console.log("Using pre-parsed best model name:", bestModelFromLeaderboard);
      return bestModelFromLeaderboard;
    }
    
    // Second priority: Use model_display_name if available
    if (model_display_name) return model_display_name;
    
    // Third priority: Use the first model from leaderboard array
    if (bestModelDetails?.name) {
      const parts = bestModelDetails.name.split('_');
      if (parts.length >= 2) {
        return `${parts[0]}_${parts[1]}`;
      }
      return parts[0]; // If only one part exists
    }
    
    // Fourth priority: Check if we have CSV data as a string and parse it
    if (typeof experimentResults.leaderboard_csv === 'string' && experimentResults.leaderboard_csv.trim()) {
      try {
        // Parse first line of CSV data
        const lines = experimentResults.leaderboard_csv.trim().split('\n');
        if (lines.length >= 2) { // Need at least header and one data row
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const values = lines[1].split(',').map(v => v.trim().replace(/"/g, ''));
          
          // Find the column index for model_id or name
          const modelIdIndex = headers.findIndex(h => 
            h === 'model_id' || h === 'name' || h === 'algorithm' || h.includes('model')
          );
          
          if (modelIdIndex !== -1 && values[modelIdIndex]) {
            const modelId = values[modelIdIndex];
            const parts = modelId.split('_');
            if (parts.length >= 2) {
              return `${parts[0]}_${parts[1]}`;
            }
            return parts[0];
          }
        }
      } catch (e) {
        console.error('Error parsing leaderboard CSV for model name:', e);
      }
    }
    
    // Fifth priority: Check if there's a leaderboard file with a URL to fetch
    const leaderboardFile = experimentResults.files?.find(file => 
      file.file_type === 'leaderboard_csv' || 
      file.file_url?.includes('leaderboard')
    );
    
    if (leaderboardFile?.file_url) {
      // Just use filename-based detection
      const modelName = leaderboardFile.file_name || leaderboardFile.file_type;
      if (modelName && modelName.includes('_')) {
        const parts = modelName.split('_');
        if (parts.length >= 2) {
          return `${parts[0]}_${parts[1]}`;
        }
        return parts[0];
      }
    }
    
    // Final fallback: Use any available metrics info or default name
    return metrics.best_model_label || metrics.model_name || 'Best Model';
  };
  
  const bestModelName = model_display_name || 
                       bestModelDetails?.name || 
                       metrics.best_model_label || 
                       'Best Model';
                       
  const shortModelName = getShortModelName();

  // Get primary metric based on task type
  const getPrimaryMetric = () => {
    if (task_type?.includes('classification')) {
      return {
        name: metrics.metric_used || 'auc',
        value: metrics.metric_value || metrics.auc || metrics.accuracy || metrics.f1_score
      };
    } else {
      return {
        name: metrics.metric_used || 'rmse',
        value: metrics.metric_value || metrics.rmse || metrics.mse || metrics.mae || metrics.r2
      };
    }
  };

  const primaryMetric = getPrimaryMetric();
  
  // Filter files by type - updated to include importance and evaluation_curve
  const getFilesByType = (fileType: string) => {
    return files.filter(file => file.file_type === fileType || file.file_type.includes(fileType));
  };

  const visualizationFiles = [
    ...getFilesByType('confusion_matrix'),
    ...getFilesByType('roc_curve'),
    ...getFilesByType('variable_importance'),
    ...getFilesByType('shap'),
    ...getFilesByType('partial_dependence'),
    ...getFilesByType('importance'),
    ...getFilesByType('evaluation_curve')
  ];

  const modelFile = files.find(file => 
    file.file_type === 'model' || 
    file.file_type.includes('model')
  );
  
  const predictionsFile = files.find(file => 
    file.file_type === 'predictions_csv' ||
    file.file_type.includes('predictions')
  );
  
  // Format created_at date for display
  const formattedCreatedAt = created_at ? formatDateForGreece(new Date(created_at), 'PP p') : 'N/A';
  const formattedCompletedAt = completed_at ? formatDateForGreece(new Date(completed_at), 'PP p') : 'N/A';

  return (
    <Card className="w-full mt-6 border border-primary/20 rounded-lg shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">
              {experiment_name || 'H2O Experiment Results'}
            </CardTitle>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            Engine: {automl_engine?.toUpperCase() || 'H2O'}
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
          
          <span className="inline-flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Created: <span className="font-semibold ml-1">{formattedCreatedAt}</span>
          </span>
          
          {experimentId && (
            <span className="inline-flex items-center">
              <span className="font-mono text-xs text-muted-foreground">ID: {experimentId.substring(0, 8)}</span>
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
            
            <TabsTrigger value="leaderboard" className="text-sm flex items-center gap-1">
              <TableIcon className="h-4 w-4" />
              <span>Leaderboard</span>
            </TabsTrigger>
            
            <TabsTrigger value="charts" className="text-sm flex items-center gap-1">
              <BarChart4 className="h-4 w-4" />
              <span>Charts</span>
            </TabsTrigger>
            
            <TabsTrigger value="predictions" className="text-sm flex items-center gap-1">
              <Info className="h-4 w-4" />
              <span>Predictions</span>
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
                      <span className="text-sm font-medium">{shortModelName}</span>
                      
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
                  <CardTitle className="text-base">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {primaryMetric.name.replace(/_/g, ' ')}
                      </h3>
                      <p className="text-3xl font-bold text-primary">
                        {isPercentageMetric(primaryMetric.name) 
                          ? formatMetricValue(primaryMetric.value, true)
                          : formatMetricValue(primaryMetric.value, false)}
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
                          key === 'mean_per_class_error' ||  // Skip it here, we'll handle it separately
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
                      
                      {/* Replace individual boxes with a table for mean_per_class_error */}
                      {metrics.mean_per_class_error && Array.isArray(metrics.mean_per_class_error) && 
                       metrics.mean_per_class_error.length > 0 && 
                       Array.isArray(metrics.mean_per_class_error[0]) && (
                        <div className="col-span-3 p-3 bg-muted/40 rounded-md">
                          <span className="block text-sm text-muted-foreground mb-2">
                            Per Class Error Rates
                          </span>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Class</TableHead>
                                <TableHead>Error Rate</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell>0</TableCell>
                                <TableCell>{formatMetricValue(metrics.mean_per_class_error[0][0], true)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>1</TableCell>
                                <TableCell>{formatMetricValue(metrics.mean_per_class_error[0][1], true)}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="p-6">
            {hasLeaderboardData ? (
              <Card>
                <CardHeader>
                  <CardTitle>Model Leaderboard</CardTitle>
                  <CardDescription>
                    Performance comparison of models trained during AutoML
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    {/* Pass onBestModelFound callback to H2OLeaderboardTable */}
                    <H2OLeaderboardTable 
                      data={leaderboardData}
                      defaultSortMetric={primaryMetric?.name || 'auc'}
                      selectedModelId={selectedModel}
                      onBestModelFound={handleBestModelFound}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12">
                <TableIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Leaderboard Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Leaderboard information is not available for this experiment.
                </p>
              </div>
            )}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Model File Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-center">Model File</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-2">
                  {modelFile ? (
                    <Button asChild>
                      <a href={modelFile.file_url} download>
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
              
              {/* Predictions Card */}
              <Card className="shadow-sm col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Predictions</CardTitle>
                </CardHeader>
                <CardContent>
                  {predictionsFile ? (
                    <CSVPreview
                      fileUrl={predictionsFile.file_url}
                      downloadUrl={predictionsFile.file_url}
                      maxRows={10}
                      engineName={automl_engine?.toUpperCase()}
                    />
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">
                        No prediction data available for this experiment
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
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
            {formattedCompletedAt}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default H2OExperimentResults;
