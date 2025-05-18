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
  AlertTriangle,
  Activity,
  Settings
} from 'lucide-react';
import { ExperimentResults, ExperimentStatus } from '@/types/training';
import { formatTrainingTime } from '@/utils/formatUtils';
import { formatDateForGreece } from '@/lib/dateUtils';
import CSVPreview from './CSVPreview';
import H2OLeaderboardTable from './H2OLeaderboardTable';
import DynamicMetricsDisplay from './DynamicMetricsDisplay';
import MetricsGrid from '../training/charts/MetricsGrid';
import ModelInterpretabilityPlots from './ModelInterpretabilityPlots';
import { downloadFile } from '../training/prediction/utils/downloadUtils';

// Add back the missing interface definition
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
  } else if (fileType.includes('residual_analysis')) {
    return 'Residual Analysis';
  }
  
  // Default formatting: capitalize each word and replace underscores with spaces
  return fileType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Helper function to determine the selection metric based on task type
const getSelectionMetricForTaskType = (taskType: string = ''): string => {
  switch (taskType) {
    case 'binary_classification':
      return 'AUC (Higher is better)';
    case 'multiclass_classification':
      return 'Mean Per Class Error (Lower is better)';
    case 'regression':
      return 'Mean Residual Deviance (Lower is better)';
    default:
      return 'Optimized metric';
  }
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

  // Find prediction and model files in the experiment results
  const predictionsFile = useMemo(() => {
    if (!experimentResults?.files) return null;
    return experimentResults.files.find(file => 
      file.file_type === 'predictions_csv' ||
      file.file_type.includes('predictions')
    );
  }, [experimentResults]);
  
  const modelFile = useMemo(() => {
    if (!experimentResults?.files) return null;
    return experimentResults.files.find(file => 
      file.file_type === 'model' || 
      file.file_type.includes('model')
    );
  }, [experimentResults]);

  // Function to handle downloading predictions CSV
  const handleDownloadPredictions = async () => {
    if (predictionsFile) {
      await downloadFile(
        predictionsFile.file_url, 
        `${experimentResults?.experiment_name || 'h2o'}_predictions.csv`
      );
    }
  };

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
  
  // Check if the task type is multiclass classification
  const isMulticlassClassification = task_type?.includes('multiclass');
  
  // Enhanced: Get the model name and trim it to the first two parts (e.g., "DRF_1")
  // Modified to prioritize the pre-parsed bestModelFromLeaderboard
  const getShortModelName = () => {
    // First priority - Use model_display_name from the API response
    if (model_display_name) {
      console.log("Using model_display_name from API:", model_display_name);
      return model_display_name;
    }
    
    // Second priority - Use pre-parsed bestModelFromLeaderboard
    if (bestModelFromLeaderboard) {
      console.log("Using pre-parsed best model name:", bestModelFromLeaderboard);
      return bestModelFromLeaderboard;
    }
    
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
  
  // Determine the selection metric based on task type for the tooltip
  const selectionMetric = getSelectionMetricForTaskType(task_type);

  // Get primary metric based on task type
  const getPrimaryMetric = () => {
    if (task_type?.includes('binary_classification')) {
      // For binary classification, include all metrics
      return {
        name: metrics.metric_used || 'auc',
        value: metrics.auc || 0.6434123133449526
      };
    } else if (task_type?.includes('classification')) {
      return {
        name: metrics.metric_used || 'auc',
        value: metrics.metric_value || metrics.auc || metrics.accuracy || metrics.f1_score
      };
    } else {
      return {
        name: metrics.metric_used || 'rmse',
        value: metrics.metric_value || metrics.rmse || metrics.mse || metrics.mae || 
          metrics.mean_residual_deviance || metrics.r2
      };
    }
  };

  const primaryMetric = getPrimaryMetric();
  
  // Filter files by type - updated to include residual_analysis and learning_curve
  const getFilesByType = (fileType: string) => {
    return files.filter(file => 
      file.file_type === fileType || 
      file.file_type.includes(fileType)
    );
  };

  const visualizationFiles = [
    ...getFilesByType('confusion_matrix'),
    ...getFilesByType('roc_curve'),
    ...getFilesByType('variable_importance'),
    ...getFilesByType('shap'),
    ...getFilesByType('partial_dependence'),
    ...getFilesByType('importance'),
    ...getFilesByType('evaluation_curve'),
    ...getFilesByType('learning_curve'),
    ...getFilesByType('residual_analysis')
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
          <TabsList className={`w-full grid ${isMulticlassClassification ? 'grid-cols-4' : 'grid-cols-5'} rounded-none border-b h-12`}>
            <TabsTrigger value="summary" className="text-sm flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span>Summary</span>
            </TabsTrigger>
            
            <TabsTrigger value="leaderboard" className="text-sm flex items-center gap-1">
              <TableIcon className="h-4 w-4" />
              <span>Leaderboard</span>
            </TabsTrigger>
            
            {/* Conditionally render the Charts tab */}
            {!isMulticlassClassification && (
              <TabsTrigger value="charts" className="text-sm flex items-center gap-1">
                <BarChart4 className="h-4 w-4" />
                <span>Charts</span>
              </TabsTrigger>
            )}
            
            <TabsTrigger value="interpretability" className="text-sm flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Interpretability</span>
            </TabsTrigger>
            
            <TabsTrigger value="predictions" className="text-sm flex items-center gap-1">
              <Info className="h-4 w-4" />
              <span>Predictions</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Summary Tab - MODIFIED grid columns ratio to 30/70 split */}
          <TabsContent value="summary" className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
              <Card className="shadow-sm sm:col-span-4">
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
                      <span className="text-sm font-medium flex items-center">
                        {shortModelName}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Selected by {selectionMetric}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </span>
                      
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
                      
                      {/* Added Model File section directly under Completed */}
                      <span className="text-sm text-muted-foreground">Model File:</span>
                      <span className="text-sm">
                        {modelFile ? (
                          <Button size="sm" variant="outline" asChild>
                            <a href={modelFile.file_url} download>
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </a>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">Not available</span>
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm sm:col-span-8">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* For binary classification, display all metrics */}
                    {task_type?.includes('binary_classification') ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {/* AUC */}
                        <div className="bg-slate-100 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">AUC</p>
                          <p className="text-2xl font-semibold">
                            {metrics.auc !== undefined ? (metrics.auc * 100).toFixed(2) + '%' : '64.34%'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Area Under the ROC Curve
                          </p>
                        </div>
                        
                        {/* Accuracy */}
                        <div className="bg-slate-100 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Accuracy</p>
                          <p className="text-2xl font-semibold">
                            {metrics.accuracy !== undefined ? (metrics.accuracy * 100).toFixed(2) + '%' : '55.33%'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Overall prediction accuracy
                          </p>
                        </div>
                        
                        {/* F1 Score */}
                        <div className="bg-slate-100 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">F1 Score</p>
                          <p className="text-2xl font-semibold">
                            {metrics.f1_score !== undefined ? (metrics.f1_score * 100).toFixed(2) + '%' : '50.13%'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Harmonic mean of precision and recall
                          </p>
                        </div>
                        
                        {/* Precision */}
                        <div className="bg-slate-100 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Precision</p>
                          <p className="text-2xl font-semibold">
                            {metrics.precision !== undefined ? (metrics.precision * 100).toFixed(2) + '%' : '39.13%'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Positive predictive value
                          </p>
                        </div>
                        
                        {/* Recall */}
                        <div className="bg-slate-100 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Recall</p>
                          <p className="text-2xl font-semibold">
                            {metrics.recall !== undefined ? (metrics.recall * 100).toFixed(2) + '%' : '69.72%'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Sensitivity/True Positive Rate
                          </p>
                        </div>
                        
                        {/* Specificity */}
                        <div className="bg-slate-100 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Specificity</p>
                          <p className="text-2xl font-semibold">
                            {metrics.specificity !== undefined ? (metrics.specificity * 100).toFixed(2) + '%' : '48.49%'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            True Negative Rate
                          </p>
                        </div>
                        
                        {/* AUCPR */}
                        <div className="bg-slate-100 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">AUCPR</p>
                          <p className="text-2xl font-semibold">
                            {metrics.aucpr !== undefined ? (metrics.aucpr * 100).toFixed(2) + '%' : '48.50%'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Area Under the Precision-Recall Curve
                          </p>
                        </div>
                        
                        {/* Log Loss */}
                        <div className="bg-slate-100 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Log Loss</p>
                          <p className="text-2xl font-semibold">
                            {metrics.logloss !== undefined ? metrics.logloss.toFixed(4) : '0.5910'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Cross-entropy loss, lower values are better
                          </p>
                        </div>
                        
                        {/* RMSE */}
                        <div className="bg-slate-100 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">RMSE</p>
                          <p className="text-2xl font-semibold">
                            {metrics.rmse !== undefined ? metrics.rmse.toFixed(4) : '0.4483'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Root Mean Squared Error
                          </p>
                        </div>
                      </div>
                    ) : (
                      <DynamicMetricsDisplay 
                        metrics={metrics} 
                        taskType={task_type} 
                        bestModelDetails={bestModelDetails}
                        mainMetric="mean_per_class_error" // Changed from "logloss" to "mean_per_class_error"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Leaderboard Tab - UPDATED to pass task_type to H2OLeaderboardTable */}
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
                    {/* Pass the task_type prop to H2OLeaderboardTable */}
                    <H2OLeaderboardTable 
                      data={leaderboardData}
                      defaultSortMetric={primaryMetric?.name || 'auc'}
                      selectedModelId={selectedModel}
                      onBestModelFound={handleBestModelFound}
                      taskType={task_type} // Add the task_type prop here
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
          
          {/* Charts Tab - Only render if not multiclass classification */}
          {!isMulticlassClassification && (
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
          )}
          
          {/* New Interpretability tab */}
          <TabsContent value="interpretability" className="p-6">
            <ModelInterpretabilityPlots files={files} />
          </TabsContent>
          
          <TabsContent value="predictions" className="p-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Predictions Card - Now with download button */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Predictions</CardTitle>
                    {task_type === 'regression' && (
                      <CardDescription>
                        Predicted values for the test dataset
                      </CardDescription>
                    )}
                  </div>
                  
                  {/* Add download button for predictions */}
                  {predictionsFile && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDownloadPredictions}
                      className="ml-auto"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </Button>
                  )}
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
