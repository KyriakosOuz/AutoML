import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  BarChart4, 
  Clock, 
  Image as ImageIcon, 
  RefreshCw,
  DownloadCloud,
  Activity,
  LineChart,
  Table as TableIcon,
  BookOpen,
  Loader,
  AlertTriangle,
  ChevronLeft,
  FileText
} from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExperimentResults, ExperimentStatus } from '@/types/training';
import { useTraining } from '@/contexts/TrainingContext';
import { useToast } from '@/hooks/use-toast';
import { trainingApi } from '@/lib/api';

interface UnifiedExperimentResultsProps {
  onReset: () => void;
  onBack?: () => void;
}

const TIMEOUT_DURATION = 60000; // 60 seconds in milliseconds

const UnifiedExperimentResults: React.FC<UnifiedExperimentResultsProps> = ({ 
  onReset,
  onBack
}) => {
  const { toast } = useToast();
  const { 
    activeExperimentId, 
    experimentResults, 
    isLoadingResults, 
    error, 
    setError,
    setActiveExperimentId,
    setExperimentResults,
    setIsLoadingResults
  } = useTraining();
  const [activeTab, setActiveTab] = useState('metrics');
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (activeExperimentId && (isLoadingResults || !experimentResults)) {
      pollInterval = setInterval(() => {
        trainingApi.getExperimentResults(activeExperimentId)
          .then(data => {
            if (data.status === 'completed' || data.status === 'success') {
              clearInterval(pollInterval);
              setExperimentResults(data);
              setIsLoadingResults(false);
              toast({
                title: "Training Complete",
                description: "Your model has finished training!"
              });
            } else if (data.status === 'failed') {
              clearInterval(pollInterval);
              setError(data.error_message || 'Training failed');
              setIsLoadingResults(false);
              toast({
                title: "Training Failed",
                description: data.error_message || 'An error occurred during training',
                variant: "destructive"
              });
            }
          })
          .catch(error => {
            console.error('Polling error:', error);
            // Don't clear interval on network errors - keep trying
          });
      }, 2000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [activeExperimentId, isLoadingResults, setExperimentResults, setIsLoadingResults, setError, toast]);

  if (isLoadingResults) {
    return (
      <Card className="w-full mt-6 rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Award className="h-5 w-5 mr-2 text-primary" />
            Training Experiment
          </CardTitle>
          <CardDescription>
            {hasTimedOut ? "Training is taking longer than expected" : "Loading experiment results..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin">
              <Loader className="h-12 w-12 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              {hasTimedOut 
                ? "The training process is still running but taking longer than expected"
                : "Processing your model training experiment..."
              }
            </p>
            {activeExperimentId && (
              <p className="text-xs font-mono text-muted-foreground">
                Experiment ID: {activeExperimentId}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || experimentResults?.status === 'failed') {
    const errorMessage = error || experimentResults?.error_message || "The training process failed.";
    return (
      <Card className="w-full mt-6 rounded-lg shadow-md border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Training Error
          </CardTitle>
          <CardDescription>
            There was a problem with your experiment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md">
            <p className="text-destructive">{errorMessage}</p>
          </div>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={onReset}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!experimentResults || (experimentResults.status !== 'completed' && experimentResults.status !== 'success')) {
    return null;
  }

  const {
    experiment_name,
    task_type = '',
    target_column,
    metrics = {},
    files = [],
    algorithm,
    automl_engine,
    training_time_sec,
    completed_at,
    columns_to_keep = [],
    hyperparameters = {},
    model_file_url,
    report_file_url,
    leaderboard = [],
    status
  } = experimentResults;

  const formatTaskType = (type: string) => {
    if (!type) return "Unknown";
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  const formatMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return (value * 100).toFixed(2) + '%';
  };
  
  const formatRegressionMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return value.toFixed(4);
  };
  
  const getMetricColor = (value: number | undefined) => {
    if (value === undefined) return 'text-gray-400';
    if (value >= 0.9) return 'text-green-600';
    if (value >= 0.7) return 'text-emerald-600';
    if (value >= 0.5) return 'text-amber-600';
    return 'text-red-600';
  };

  const isClassification = task_type ? task_type.includes('classification') : false;
  const isAutoML = automl_engine === 'mljar' || automl_engine === 'h2o';
  
  if (status === 'running' as ExperimentStatus) {
    return (
      <Card className="w-full mt-6 rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Award className="h-5 w-5 mr-2 text-primary" />
            {experiment_name || 'Training Experiment'}
          </CardTitle>
          <CardDescription>
            Model training is in progress...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin">
              <Loader className="h-12 w-12 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Processing your {isAutoML ? 'AutoML' : 'custom'} training experiment...
            </p>
            <p className="text-xs font-mono text-muted-foreground">
              Algorithm: {algorithm || (isAutoML ? automl_engine?.toUpperCase() : 'Custom')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mt-6 border border-primary/20 rounded-lg shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">{experiment_name || 'Model Training Results'}</CardTitle>
          </div>
          
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {algorithm || (isAutoML ? automl_engine?.toUpperCase() : (task_type ? task_type.replace(/_/g, ' ') : 'Unknown'))}
          </Badge>
        </div>
        
        <CardDescription className="flex flex-wrap gap-x-4 mt-2">
          <span className="inline-flex items-center">
            Task: <span className="font-semibold ml-1">{formatTaskType(task_type)}</span>
          </span>
          
          <span className="inline-flex items-center">
            Target: <span className="font-semibold ml-1">{target_column || 'N/A'}</span>
          </span>
          
          {training_time_sec && (
            <span className="inline-flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Time: <span className="font-semibold ml-1">{training_time_sec.toFixed(1)}s</span>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 rounded-none border-b h-12">
            <TabsTrigger value="metrics" className="text-sm flex items-center gap-1">
              <Activity className="h-4 w-4" />
              <span>Metrics</span>
            </TabsTrigger>
            
            <TabsTrigger value="visualizations" className="text-sm flex items-center gap-1">
              <BarChart4 className="h-4 w-4" />
              <span>Visualizations</span>
            </TabsTrigger>
            
            {isAutoML && (
              <TabsTrigger value="leaderboard" className="text-sm flex items-center gap-1">
                <Award className="h-4 w-4" />
                <span>Leaderboard</span>
              </TabsTrigger>
            )}
            
            {!isAutoML && (
              <TabsTrigger value="details" className="text-sm flex items-center gap-1">
                <TableIcon className="h-4 w-4" />
                <span>Details</span>
              </TabsTrigger>
            )}
            
            <TabsTrigger value="downloads" className="text-sm flex items-center gap-1">
              <DownloadCloud className="h-4 w-4" />
              <span>Downloads</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {isClassification ? (
                <>
                  {metrics.accuracy !== undefined && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Accuracy</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.accuracy)}`}>
                          {formatMetric(metrics.accuracy)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.f1_score !== undefined && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">F1 Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.f1_score)}`}>
                          {formatMetric(metrics.f1_score)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.precision !== undefined && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Precision</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.precision)}`}>
                          {formatMetric(metrics.precision)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.recall !== undefined && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Recall</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.recall)}`}>
                          {formatMetric(metrics.recall)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <>
                  {metrics.r2_score !== undefined && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">R² Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.r2_score)}`}>
                          {formatRegressionMetric(metrics.r2_score)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.mae !== undefined && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Mean Absolute Error</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatRegressionMetric(metrics.mae)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.mse !== undefined && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Mean Squared Error</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatRegressionMetric(metrics.mse)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.rmse !== undefined && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Root Mean Squared Error</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatRegressionMetric(metrics.rmse)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
            
            {metrics.classification_report && (
              <div className="mt-6">
                <h3 className="text-base font-semibold mb-2">Classification Report</h3>
                <div className="bg-muted/40 p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-xs font-mono overflow-x-auto">
                    {typeof metrics.classification_report === 'string' 
                      ? metrics.classification_report 
                      : JSON.stringify(metrics.classification_report, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="visualizations" className="p-6">
            {files.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {files.map((file, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <Card className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md">
                        <CardContent className="p-3">
                          <div className="aspect-video bg-muted flex justify-center items-center rounded-md relative overflow-hidden">
                            <div 
                              className="absolute inset-0 bg-cover bg-center"
                              style={{ backgroundImage: `url(${file.file_url})` }}
                            />
                            <div className="absolute inset-0 bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors" />
                          </div>
                          <div className="mt-2 text-center">
                            <p className="text-sm font-medium">
                              {file.file_type.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
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
                          <h3 className="font-medium">
                            {file.file_type.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </h3>
                          <Button variant="outline" size="sm" asChild>
                            <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                              <DownloadCloud className="h-4 w-4 mr-1" />
                              Download
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
                <BarChart4 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Visualizations Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Visualizations may not be available for this model or are still being generated.
                </p>
              </div>
            )}
          </TabsContent>
          
          {isAutoML && (
            <TabsContent value="leaderboard" className="p-6">
              {leaderboard && leaderboard.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Algorithm</TableHead>
                        <TableHead>Metrics</TableHead>
                        <TableHead>Training Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.map((model: any, index: number) => (
                        <TableRow key={index} className={index === 0 ? "bg-primary/5 font-medium" : ""}>
                          <TableCell className="font-medium">
                            {index === 0 ? (
                              <Badge variant="default" className="mr-1">
                                {index + 1}
                              </Badge>
                            ) : (
                              index + 1
                            )}
                          </TableCell>
                          <TableCell>
                            {model.algorithm || model.name || "Unknown"}
                          </TableCell>
                          <TableCell>
                            {isClassification 
                              ? `Accuracy: ${formatMetric(model.metrics?.accuracy || model.accuracy)}`
                              : `R²: ${formatRegressionMetric(model.metrics?.r2_score || model.r2_score)}`
                            }
                          </TableCell>
                          <TableCell>
                            {model.training_time 
                              ? `${model.training_time.toFixed(2)}s`
                              : "N/A"
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
          )}
          
          {!isAutoML && (
            <TabsContent value="details" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Model Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Algorithm:</span>
                        <span className="font-medium">{algorithm || 'AutoML'}</span>
                        
                        <span className="text-muted-foreground">Task Type:</span>
                        <span className="font-medium">{formatTaskType(task_type)}</span>
                        
                        <span className="text-muted-foreground">Target Column:</span>
                        <span className="font-medium">{target_column}</span>
                        
                        <span className="text-muted-foreground">Experiment ID:</span>
                        <span className="font-mono text-xs">{activeExperimentId}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Feature Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {columns_to_keep.map((column, index) => (
                          <Badge key={index} variant="secondary" className="bg-primary/5">
                            {column}
                          </Badge>
                        ))}
                        {columns_to_keep.length === 0 && (
                          <p className="text-sm text-muted-foreground">No specific columns selected</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {Object.keys(hyperparameters).length > 0 && (
                  <Card className="shadow-sm md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Hyperparameters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Parameter</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(hyperparameters).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell className="font-medium">{key}</TableCell>
                              <TableCell>
                                {typeof value === 'object' 
                                  ? JSON.stringify(value) 
                                  : String(value)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}
          
          <TabsContent value="downloads" className="p-6">
            <div className="flex flex-col items-center justify-center py-6 space-y-6">
              {model_file_url ? (
                <Card className="w-full max-w-md shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Trained Model</CardTitle>
                    <CardDescription>Download the trained model file</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center pb-6">
                    <Button asChild>
                      <a href={model_file_url} download target="_blank" rel="noopener noreferrer">
                        <DownloadCloud className="h-4 w-4 mr-2" />
                        Download Model
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
              
              {report_file_url ? (
                <Card className="w-full max-w-md shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Full Report</CardTitle>
                    <CardDescription>View the complete analysis report</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center pb-6">
                    <Button asChild>
                      <a href={report_file_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        View Full Report
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    No additional reports are available for this experiment.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <div className="flex gap-2">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button variant="outline" onClick={onReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            New Experiment
          </Button>
        </div>
        
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

export default UnifiedExperimentResults;
