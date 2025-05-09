
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Award, 
  BarChart4, 
  FileText, 
  RefreshCw, 
  Database,
  Layers,
  Download,
  ChartLine,
  ChartPie,
  Loader,
  Check
} from 'lucide-react';
import { ExperimentResults } from '@/types/training';
import { ExperimentStatus } from '@/types/training';
import { formatTrainingTime } from '@/utils/formatUtils';

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

const H2OExperimentResults: React.FC<H2OExperimentResultsProps> = ({
  experimentId,
  status,
  experimentResults,
  isLoading,
  error,
  onReset,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<string>('metrics');
  
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
            <Alert className="h-5 w-5 mr-2" />
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
            <Database className="h-12 w-12 text-muted-foreground" />
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
  } = experimentResults;

  // Find best model details
  const bestModelName = metrics.best_model_details?.name || 
                       metrics.best_model_label || 
                       'Best Model';
                      
  const bestModelScore = metrics.best_model_details?.metric_value || 
                        metrics.metric_value || 
                        '';

  // Prepare visualizations
  const visualizations = {};
  const visualizationFiles = [];
  
  // Map files to visualization types
  for (const file of files) {
    // Check if the file is a visualization
    if (file.file_type.includes('png') || 
        file.file_url.includes('png') ||
        file.file_name?.includes('png')) {
      
      if (file.file_type.includes('shap') || file.file_url.includes('shap')) {
        visualizations['shap'] = file.file_url;
        visualizationFiles.push({...file, type: 'shap', name: 'SHAP Importance'});
      }
      else if (file.file_type.includes('importance') || file.file_url.includes('importance')) {
        visualizations['importance'] = file.file_url;
        visualizationFiles.push({...file, type: 'importance', name: 'Feature Importance'});
      }
      else if (file.file_type.includes('roc') || file.file_url.includes('roc')) {
        visualizations['roc'] = file.file_url;
        visualizationFiles.push({...file, type: 'roc', name: 'ROC Curve'});
      }
      else if (file.file_type.includes('confusion') || file.file_url.includes('confusion')) {
        visualizations['confusion'] = file.file_url;
        visualizationFiles.push({...file, type: 'confusion', name: 'Confusion Matrix'});
      }
      else {
        // Generic visualization
        visualizationFiles.push({
          ...file,
          type: 'other', 
          name: file.file_type
            .replace(/_/g, ' ')
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        });
      }
    }
  }
  
  // Find downloadable files
  const leaderboardFile = files.find(f => 
    f.file_type.includes('leaderboard') || 
    f.file_url.includes('leaderboard')
  );
  
  const predictionsFile = files.find(f => 
    f.file_type.includes('predictions') || 
    f.file_url.includes('predictions')
  );
  
  const modelFile = files.find(f => 
    f.file_type === 'model' || 
    f.file_url.includes('model')
  );
  
  // Extract confusion matrix if present
  const confusionMatrix = metrics.confusion_matrix;

  return (
    <Card className="w-full mt-6 border border-primary/20 rounded-lg shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">{experiment_name || 'H2O Experiment Results'}</CardTitle>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            Engine: H2O AutoML
          </Badge>
        </div>
        
        <CardDescription className="flex flex-wrap gap-x-4 mt-2">
          <span className="inline-flex items-center">
            <Layers className="h-3.5 w-3.5 mr-1" />
            Task: <span className="font-semibold ml-1">{formatTaskType(task_type)}</span>
          </span>
          
          {target_column && (
            <span className="inline-flex items-center">
              <Database className="h-3.5 w-3.5 mr-1" />
              Target: <span className="font-semibold ml-1">{target_column}</span>
            </span>
          )}
          
          {training_time_sec && (
            <span className="inline-flex items-center">
              <Loader className="h-3.5 w-3.5 mr-1" />
              Time: <span className="font-semibold ml-1">{formatTrainingTime(training_time_sec)}</span>
            </span>
          )}
          
          {experiment_id && (
            <span className="inline-flex items-center">
              <span className="font-mono text-xs text-muted-foreground">ID: {typeof experiment_id === 'string' ? experiment_id.substring(0, 8) : 'N/A'}</span>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-none border-b h-12">
            <TabsTrigger value="metrics" className="text-sm flex items-center gap-1">
              <ChartPie className="h-4 w-4" />
              <span>Metrics</span>
            </TabsTrigger>
            
            <TabsTrigger value="visualizations" className="text-sm flex items-center gap-1">
              <BarChart4 className="h-4 w-4" />
              <span>Visualizations</span>
            </TabsTrigger>
            
            <TabsTrigger value="downloads" className="text-sm flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>Downloads</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Metrics Tab */}
          <TabsContent value="metrics" className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Best Model</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                      <span className="text-sm text-muted-foreground">Model Name:</span>
                      <span className="text-sm font-medium">{bestModelName}</span>
                      
                      {bestModelScore && (
                        <>
                          <span className="text-sm text-muted-foreground">Model Score:</span>
                          <span className="text-sm font-medium">{
                            typeof bestModelScore === 'number' ? 
                              bestModelScore.toFixed(4) : bestModelScore
                          }</span>
                        </>
                      )}
                      
                      <span className="text-sm text-muted-foreground">Task Type:</span>
                      <span className="text-sm font-medium">{formatTaskType(task_type)}</span>
                      
                      <span className="text-sm text-muted-foreground">Target Column:</span>
                      <span className="text-sm font-medium">{target_column}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(metrics).map(([key, value]) => {
                      // Skip nested objects, arrays and special metrics
                      if (
                        key === 'confusion_matrix' ||
                        key === 'best_model_details' ||
                        key === 'classification_report' ||
                        typeof value === 'object' ||
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
                  
                  {/* Confusion Matrix */}
                  {confusionMatrix && (
                    <div className="mt-6">
                      <h3 className="text-base font-semibold mb-2">Confusion Matrix</h3>
                      <div className="overflow-x-auto">
                        <Table className="w-full">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[100px]">Actual ↓ Predicted →</TableHead>
                              {confusionMatrix.columns?.map((col, index) => (
                                <TableHead key={index}>{col}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {confusionMatrix.data?.map((row, rowIndex) => (
                              <TableRow key={rowIndex}>
                                <TableCell className="font-medium">
                                  {confusionMatrix.index?.[rowIndex]}
                                </TableCell>
                                {row.map((cell, cellIndex) => (
                                  <TableCell 
                                    key={cellIndex}
                                    className={rowIndex === cellIndex ? "bg-primary/10 font-semibold" : ""}
                                  >
                                    {cell}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Visualizations Tab */}
          <TabsContent value="visualizations" className="p-6">
            {visualizationFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visualizationFiles.map((file, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <Card className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {file.name || 'Visualization'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
                            <img 
                              src={file.file_url} 
                              alt={file.name || 'Visualization'} 
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>{file.name || 'Visualization'}</DialogTitle>
                      </DialogHeader>
                      <div className="p-1">
                        <img 
                          src={file.file_url} 
                          alt={file.name || 'Visualization'} 
                          className="w-full rounded-md"
                        />
                        <div className="mt-4 flex justify-end">
                          <Button variant="outline" size="sm" asChild>
                            <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
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
          
          {/* Downloads Tab */}
          <TabsContent value="downloads" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {leaderboardFile && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">H2O Leaderboard</CardTitle>
                    <CardDescription>
                      Download the model leaderboard with all performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" asChild>
                      <a href={leaderboardFile.file_url} download target="_blank" rel="noopener noreferrer">
                        <Database className="h-4 w-4 mr-2" />
                        Download Leaderboard
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {predictionsFile && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Predictions CSV</CardTitle>
                    <CardDescription>
                      Download the test set predictions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" asChild>
                      <a href={predictionsFile.file_url} download target="_blank" rel="noopener noreferrer">
                        <ChartLine className="h-4 w-4 mr-2" />
                        Download Predictions
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {modelFile && (
                <Card className="shadow-sm col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Trained Model</CardTitle>
                    <CardDescription>
                      Download the trained model file
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full sm:w-auto" asChild>
                      <a href={modelFile.file_url} download target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        Download Model
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {!leaderboardFile && !predictionsFile && !modelFile && (
                <div className="col-span-2 text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Downloads Available</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    No downloadable files are available for this experiment.
                  </p>
                </div>
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
            <Check className="h-3 w-3 mr-1" />
            Completed: {new Date(completed_at).toLocaleString()}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default H2OExperimentResults;
