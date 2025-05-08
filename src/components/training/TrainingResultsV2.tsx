import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { trainingApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ExperimentResults } from '@/types/training';
import { useTraining } from '@/contexts/training/TrainingContext';
import MetricsGrid from './charts/MetricsGrid';
import {
  Award, 
  BarChart4, 
  Clock, 
  Download, 
  FileText, 
  RefreshCw, 
  Layers,
  Settings,
  Activity,
  Microscope,
  Loader
} from 'lucide-react';
import { formatTrainingTime } from '@/utils/formatUtils';

export interface TrainingResultsV2Props {
  experimentId: string;
  onReset: () => void;
}

// Helper function to format task type
const formatTaskType = (type: string) => {
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

// Enhanced helper function to format visualization names
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

// Helper function to categorize visualization files
const categorizeVisualizations = (files: {file_type: string, file_url: string}[]) => {
  // Filter out model and label encoder files
  return files.filter(file => 
    file.file_type !== 'model' && 
    !file.file_type.includes('label_encoder') &&
    // Include explicitly requested visualization types
    (file.file_type.includes('confusion_matrix') ||
     file.file_type.includes('evaluation_curve') ||
     file.file_type.includes('learning_curve') ||
     file.file_type.includes('feature_importance') ||
     file.file_type.includes('roc_curve') ||
     file.file_type.includes('precision_recall'))
  );
};

// Helper function to get F1 score from either f1 or f1_score fields
const getF1Score = (metrics: { f1_score?: number; f1?: number }): number | undefined => {
  return metrics.f1_score !== undefined ? metrics.f1_score : metrics.f1;
};

const TrainingResultsV2: React.FC<TrainingResultsV2Props> = ({ experimentId, onReset }) => {
  const { isLoadingResults, experimentResults } = useTraining();
  const [activeTab, setActiveTab] = useState<string>('metrics');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Format a metric value for display
  const formatMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return (value * 100).toFixed(2) + '%';
  };
  
  // For regression metrics that shouldn't be formatted as percentages
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
  
  if (isLoadingResults || !experimentResults) {
    return (
      <Card className="w-full mt-6 rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Award className="h-5 w-5 mr-2 text-primary" />
            Training Experiment
          </CardTitle>
          <CardDescription>
            Loading experiment results...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin">
              <Loader className="h-12 w-12 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Processing your model training experiment...
            </p>
            <p className="text-xs font-mono text-muted-foreground">
              Experiment ID: {experimentId}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full mt-6 rounded-lg shadow-md border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Training Error
          </CardTitle>
          <CardDescription>
            There was a problem with your experiment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md">
            <p className="text-destructive">{error}</p>
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
  
  const results = experimentResults;
  
  if (!results) {
    return null;
  }
  
  const {
    experiment_name,
    task_type,
    target_column,
    metrics = {},
    files = [],
    algorithm,
    training_time_sec,
    completed_at,
    columns_to_keep = [],
    hyperparameters = {},
    model_file_url,
    report_file_url,
    automl_engine
  } = results;
  
  // Get unique downloadable files (model and report)
  const downloadableFiles = Array.from(new Set(
    files.filter(file => 
      file.file_type === 'model' || 
      file.file_type.includes('report')
    ).map(file => file.file_url)
  )).map(url => {
    const file = files.find(f => f.file_url === url);
    return file ? file : null;
  }).filter(Boolean) as typeof files;

  // Enhanced visualization files categorization
  const visualizationFiles = categorizeVisualizations(files);
  
  const isClassification = task_type?.includes('classification');
  
  // Display algorithm or engine based on what's available
  const displayAlgorithm = algorithm || (automl_engine ? `${automl_engine.toUpperCase()}` : 'Not specified');
  
  return (
    <Card className="w-full mt-6 border border-primary/20 rounded-lg shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">{experiment_name || 'Model Training Results'}</CardTitle>
          </div>
          
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {automl_engine ? `Engine: ${automl_engine.toUpperCase()}` : 
             algorithm ? `Algorithm: ${algorithm}` : 
             formatTaskType(task_type)}
          </Badge>
        </div>
        
        <CardDescription className="flex flex-wrap gap-x-4 mt-2">
          <span className="inline-flex items-center">
            <Layers className="h-3.5 w-3.5 mr-1" />
            Task: <span className="font-semibold ml-1">{formatTaskType(task_type)}</span>
          </span>
          
          <span className="inline-flex items-center">
            <Microscope className="h-3.5 w-3.5 mr-1" />
            Target: <span className="font-semibold ml-1">{target_column}</span>
          </span>
          
          {/* Always show training time using formatTrainingTime */}
          <span className="inline-flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Time: <span className="font-semibold ml-1">{formatTrainingTime(training_time_sec)}</span>
          </span>
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
            
            <TabsTrigger value="details" className="text-sm flex items-center gap-1">
              <Settings className="h-4 w-4" />
              <span>Configuration</span>
            </TabsTrigger>
            
            <TabsTrigger value="report" className="text-sm flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Report</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="p-6">
            {/* Use the enhanced MetricsGrid component */}
            <MetricsGrid metrics={metrics} taskType={task_type} />
            
            {/* Add Download Model button as a card */}
            {model_file_url && (
              <div className="mt-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Download Model</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" asChild>
                      <a href={model_file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
            
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
            {visualizationFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visualizationFiles.map((file, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="py-2 px-4 bg-muted/30">
                      <CardTitle className="text-sm font-medium">
                        {formatVisualizationName(file.file_type)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="cursor-pointer hover:opacity-90 transition-opacity rounded-md overflow-hidden">
                            <img 
                              src={file.file_url} 
                              alt={formatVisualizationName(file.file_type)} 
                              className="w-full rounded-md"
                            />
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <div className="p-1">
                            <img 
                              src={file.file_url} 
                              alt={formatVisualizationName(file.file_type)} 
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
                      <div className="mt-2 flex justify-end">
                        <Button variant="outline" size="sm" asChild>
                          <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
          
          <TabsContent value="details" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Model Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {automl_engine ? (
                        <>
                          <span className="text-muted-foreground">Engine:</span>
                          <span className="font-medium">{automl_engine.toUpperCase()}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-muted-foreground">Algorithm:</span>
                          <span className="font-medium">{algorithm || 'Not specified'}</span>
                        </>
                      )}
                      
                      <span className="text-muted-foreground">Task Type:</span>
                      <span className="font-medium">{formatTaskType(task_type)}</span>
                      
                      <span className="text-muted-foreground">Target Column:</span>
                      <span className="font-medium">{target_column}</span>
                      
                      <span className="text-muted-foreground">Experiment ID:</span>
                      <span className="font-mono text-xs">{experimentId}</span>
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
          
          <TabsContent value="report" className="p-6">
            <div className="flex flex-col items-center justify-center py-6 space-y-6">
              {model_file_url && (
                <Card className="w-full max-w-md shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Trained Model</CardTitle>
                    <CardDescription>Download the trained model file</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center pb-6">
                    <Button asChild>
                      <a href={model_file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download Model
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {report_file_url && (
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
              )}
              
              {downloadableFiles.length === 0 && (
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

export default TrainingResultsV2;
