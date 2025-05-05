
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
import ConfusionMatrixChart from '../training/charts/ConfusionMatrixChart';
import RocCurveChart from '../training/charts/RocCurveChart';
import PrecisionRecallChart from '../training/charts/PrecisionRecallChart';

interface MLJARExperimentResultsProps {
  experimentId: string | null;
  status: ExperimentStatus;
  experimentResults: ExperimentResults | null;
  isLoading: boolean;
  error: string | null;
  onReset?: () => void;
  onRefresh?: () => void;
}

// Helper function to categorize files by type
const categorizeFiles = (files: any[] = []) => {
  return {
    confusionMatrix: files.filter(f => f.file_type.includes('confusion_matrix')),
    rocCurve: files.filter(f => f.file_url.includes('roc_curve') || f.file_type.includes('roc')),
    precisionRecall: files.filter(f => f.file_url.includes('precision_recall') || f.file_type.includes('precision')),
    learningCurves: files.filter(f => f.file_type.includes('learning_curve')),
    featureImportance: files.filter(f => f.file_type.includes('feature_importance')),
    distribution: files.filter(f => f.file_type.includes('distribution')),
    readme: files.filter(f => f.file_type === 'readme' || f.file_type.includes('README')),
    modelMetadata: files.filter(f => 
      f.file_type === 'model_metadata' || 
      f.file_type.includes('model') && f.file_type.includes('metadata')
    ),
    predictions: files.filter(f => f.file_type.includes('predictions')),
    model: files.filter(f => f.file_type === 'model' && !f.file_type.includes('metadata'))
  };
};

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
    hyperparameters = {}
  } = experimentResults;

  // Find best model label if available
  const bestModelLabel = metrics.best_model_label || 
    (hyperparameters.best_model ? hyperparameters.best_model : 'Not specified');

  // Get primary metric based on task type
  const getPrimaryMetric = () => {
    if (task_type?.includes('classification')) {
      return {
        name: metrics.metric_used || 'logloss',
        value: metrics.metric_value || (metrics.logloss || metrics.f1_score || metrics.accuracy)
      };
    } else {
      return {
        name: metrics.metric_used || 'rmse',
        value: metrics.metric_value || (metrics.rmse || metrics.mse || metrics.mae || metrics.r2_score)
      };
    }
  };

  const primaryMetric = getPrimaryMetric();
  
  // Categorize files by type
  const categorizedFiles = categorizeFiles(files);

  // Format chart display name
  const formatChartName = (fileType: string) => {
    if (fileType.includes('confusion_matrix')) {
      return fileType.includes('normalized') ? 'Normalized Confusion Matrix' : 'Confusion Matrix';
    } else if (fileType.includes('roc_curve')) {
      return 'ROC Curve';
    } else if (fileType.includes('precision_recall')) {
      return 'Precision-Recall Curve';
    } else if (fileType.includes('learning_curve')) {
      return 'Learning Curve';
    } else if (fileType.includes('feature_importance')) {
      return 'Feature Importance';
    }
    return fileType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

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
            Engine: MLJAR AutoML
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
                    
                    <div className="grid grid-cols-2 gap-2">
                      {metrics.accuracy !== undefined && (
                        <>
                          <span className="text-sm text-muted-foreground">Accuracy:</span>
                          <span className="text-sm font-medium">{(metrics.accuracy * 100).toFixed(2)}%</span>
                        </>
                      )}
                      
                      {metrics.f1_score !== undefined && (
                        <>
                          <span className="text-sm text-muted-foreground">F1 Score:</span>
                          <span className="text-sm font-medium">{(metrics.f1_score * 100).toFixed(2)}%</span>
                        </>
                      )}
                      
                      {metrics.precision !== undefined && (
                        <>
                          <span className="text-sm text-muted-foreground">Precision:</span>
                          <span className="text-sm font-medium">{(metrics.precision * 100).toFixed(2)}%</span>
                        </>
                      )}
                      
                      {metrics.recall !== undefined && (
                        <>
                          <span className="text-sm text-muted-foreground">Recall:</span>
                          <span className="text-sm font-medium">{(metrics.recall * 100).toFixed(2)}%</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Confusion Matrix */}
              {metrics.confusion_matrix && (
                <Card className="shadow-sm sm:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Confusion Matrix</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center">
                      <ConfusionMatrixChart matrix={metrics.confusion_matrix} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          {/* Charts Tab */}
          <TabsContent value="charts" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ROC Curve */}
              {categorizedFiles.rocCurve.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">ROC Curve</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img 
                      src={categorizedFiles.rocCurve[0]?.file_url} 
                      alt="ROC Curve" 
                      className="w-full h-auto rounded-md"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/400x300?text=ROC+Curve+Not+Available';
                      }}
                    />
                  </CardContent>
                </Card>
              )}
              
              {/* Precision-Recall Curve */}
              {categorizedFiles.precisionRecall.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Precision-Recall Curve</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img 
                      src={categorizedFiles.precisionRecall[0]?.file_url} 
                      alt="Precision-Recall Curve" 
                      className="w-full h-auto rounded-md"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/400x300?text=PR+Curve+Not+Available';
                      }}
                    />
                  </CardContent>
                </Card>
              )}
              
              {/* Confusion Matrix */}
              {categorizedFiles.confusionMatrix.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Confusion Matrix</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img 
                      src={categorizedFiles.confusionMatrix[0]?.file_url} 
                      alt="Confusion Matrix" 
                      className="w-full h-auto rounded-md"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/400x300?text=Confusion+Matrix+Not+Available';
                      }}
                    />
                  </CardContent>
                </Card>
              )}
              
              {/* Learning Curves */}
              {categorizedFiles.learningCurves.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Learning Curves</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img 
                      src={categorizedFiles.learningCurves[0]?.file_url} 
                      alt="Learning Curves" 
                      className="w-full h-auto rounded-md"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/400x300?text=Learning+Curves+Not+Available';
                      }}
                    />
                  </CardContent>
                </Card>
              )}
              
              {/* Feature Importance */}
              {categorizedFiles.featureImportance.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Feature Importance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img 
                      src={categorizedFiles.featureImportance[0]?.file_url} 
                      alt="Feature Importance" 
                      className="w-full h-auto rounded-md"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/400x300?text=Feature+Importance+Not+Available';
                      }}
                    />
                  </CardContent>
                </Card>
              )}
              
              {/* Distribution Graphs */}
              {categorizedFiles.distribution.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img 
                      src={categorizedFiles.distribution[0]?.file_url} 
                      alt="Distribution" 
                      className="w-full h-auto rounded-md"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/400x300?text=Distribution+Not+Available';
                      }}
                    />
                  </CardContent>
                </Card>
              )}
              
              {Object.values(categorizedFiles).flat().length === 0 && (
                <div className="col-span-2 text-center py-10">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No visualization files available</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Predictions Tab */}
          <TabsContent value="predictions" className="p-6">
            {categorizedFiles.predictions.length > 0 ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Predictions</CardTitle>
                  <CardDescription>
                    Download the predictions file to view all predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center my-6">
                    <Button asChild>
                      <a href={categorizedFiles.predictions[0]?.file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download Predictions CSV
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="text-center">
                <CardContent className="py-10">
                  <TableIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No predictions file available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Model Details Tab */}
          <TabsContent value="metadata" className="p-6">
            <div className="grid grid-cols-1 gap-6">
              {categorizedFiles.readme.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">README</CardTitle>
                    <CardDescription>Documentation from MLJAR</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center my-4">
                      <Button asChild>
                        <a href={categorizedFiles.readme[0]?.file_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />
                          View README
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {categorizedFiles.modelMetadata.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Model Metadata</CardTitle>
                    <CardDescription>Technical details about the trained model</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center my-4">
                      <Button asChild>
                        <a href={categorizedFiles.modelMetadata[0]?.file_url} target="_blank" rel="noopener noreferrer">
                          <Info className="h-4 w-4 mr-2" />
                          View Model Metadata
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {categorizedFiles.modelMetadata.length === 0 && categorizedFiles.readme.length === 0 && (
                <Card className="text-center">
                  <CardContent className="py-10">
                    <Info className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">No model details available</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <Button variant="outline" onClick={onReset}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Run New Experiment
        </Button>
        
        {completed_at && (
          <div className="text-xs text-muted-foreground flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Completed: {new Date(completed_at).toLocaleString()}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default MLJARExperimentResults;
