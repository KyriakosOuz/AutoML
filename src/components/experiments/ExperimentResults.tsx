import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExperimentResults as ExperimentResultsType, TrainingResults } from '@/types/training';
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
  Loader,
  Image as ImageIcon,
  AlertTriangle,
  Info
} from 'lucide-react';
import { ExperimentStatus } from '@/contexts/training/types';
import { cn } from '@/lib/utils';

const ClassificationReportTable = ({ report }: { report: any }) => {
  if (typeof report === 'string') {
    return (
      <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto">
        {report}
      </pre>
    );
  }

  if (typeof report === 'object' && report !== null) {
    const classKeys = Object.keys(report).filter(key => 
      !['accuracy', 'macro avg', 'weighted avg', 'samples avg', 'micro avg'].includes(key)
    );
    
    const summaryKeys = Object.keys(report).filter(key => 
      ['macro avg', 'weighted avg'].includes(key)
    );

    return (
      <Table>
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
          {classKeys.map(classKey => (
            <TableRow key={classKey}>
              <TableCell className="font-medium">{classKey}</TableCell>
              <TableCell>{formatValue(report[classKey].precision)}</TableCell>
              <TableCell>{formatValue(report[classKey].recall)}</TableCell>
              <TableCell>{formatValue(report[classKey]["f1-score"])}</TableCell>
              <TableCell>{report[classKey].support}</TableCell>
            </TableRow>
          ))}
          
          {summaryKeys.map(key => (
            <TableRow key={key} className="bg-muted/50">
              <TableCell className="font-medium">{key}</TableCell>
              <TableCell>{formatValue(report[key].precision)}</TableCell>
              <TableCell>{formatValue(report[key].recall)}</TableCell>
              <TableCell>{formatValue(report[key]["f1-score"])}</TableCell>
              <TableCell>{report[key].support}</TableCell>
            </TableRow>
          ))}
          
          {report.accuracy && (
            <TableRow className="bg-primary/10">
              <TableCell className="font-medium">Accuracy</TableCell>
              <TableCell colSpan={3} className="text-center">{formatValue(report.accuracy)}</TableCell>
              <TableCell>{report.support || report['weighted avg']?.support || '-'}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }

  return <p>Classification report format not supported</p>;
};

const ConfusionMatrixTable = ({ matrix, classLabels }: { matrix: number[][], classLabels?: string[] }) => {
  if (!matrix || !Array.isArray(matrix) || matrix.length === 0) {
    return <p className="text-muted-foreground">No confusion matrix data available</p>;
  }

  const labels = classLabels || matrix.map((_, i) => String(i));

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-max">
        <TableHeader>
          <TableRow>
            <TableHead className="border border-border">Actual / Predicted</TableHead>
            {labels.map((label, i) => (
              <TableHead key={i} className="border border-border text-center">{label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {matrix.map((row, i) => (
            <TableRow key={i}>
              <TableCell className="border border-border font-medium">{labels[i]}</TableCell>
              {row.map((cell, j) => (
                <TableCell 
                  key={j} 
                  className={cn(
                    "border border-border text-center font-mono",
                    i === j ? "bg-primary/10 font-bold" : ""
                  )}
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const formatValue = (value: number | undefined) => {
  if (value === undefined) return 'N/A';
  return value >= 0 && value <= 1 ? `${(value * 100).toFixed(2)}%` : value.toFixed(4);
};

const isVisualizationFile = (fileType: string) => {
  const visualTypes = [
    'distribution', 
    'shap', 
    'confusion_matrix', 
    'importance', 
    'plot', 
    'chart', 
    'graph', 
    'visualization',
    'roc_curve',
    'precision_recall_curve',
    'class_distribution'
  ];
  return visualTypes.some(type => fileType.toLowerCase().includes(type));
};

const getMetricPriority = (metricName: string): number => {
  const priorities: Record<string, number> = {
    'accuracy': 1,
    'f1_score': 2,
    'precision': 3,
    'recall': 4,
    'r2': 1,
    'r2_score': 1,
    'mae': 2,
    'mse': 3,
    'rmse': 4,
  };
  
  return priorities[metricName] || 100;
};

interface ExperimentResultsProps {
  experimentId: string | null;
  status: ExperimentStatus;
  experimentResults: ExperimentResultsType | null;
  isLoading: boolean;
  error: string | null;
  onReset?: () => void;
  onRefresh?: () => void;
}

const ExperimentResults: React.FC<ExperimentResultsProps> = ({ 
  experimentId, 
  status, 
  experimentResults,
  isLoading,
  error,
  onReset,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<string>('metrics');
  const [showFullPredictions, setShowFullPredictions] = useState(false);

  if (isLoading || status === 'processing' || status === 'running') {
    return (
      <Card className="w-full mt-6 rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Award className="h-5 w-5 mr-2 text-primary" />
            Loading Experiment Results
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
              Loading experiment data...
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
            There was a problem with your experiment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          {onReset && (
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={onReset}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
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
            No Experiment Selected
          </CardTitle>
          <CardDescription>
            Select or run an experiment to view results
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No experiment data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const {
    experiment_name,
    task_type,
    algorithm,
    automl_engine,
    target_column,
    training_time_sec,
    created_at,
    completed_at,
    files = [],
    hyperparameters,
    columns_to_keep,
    class_labels,
    training_results = {} as TrainingResults
  } = experimentResults;
  
  const metrics = training_results?.metrics || {};
  const confusionMatrix = training_results?.confusion_matrix || metrics?.confusion_matrix || [];
  const classificationReport = training_results?.classification_report || metrics?.classification_report;
  const yTrue = training_results?.y_true || [];
  const yPred = training_results?.y_pred || [];
  const yProbs = training_results?.y_probs || [];
  
  const isClassification = task_type?.includes('classification');
  
  const sortedMetricEntries = Object.entries(metrics)
    .filter(([key, value]) => 
      typeof value === 'number' && 
      !['support', 'samples', 'confidence'].includes(key) &&
      !key.includes('_avg') &&
      !key.includes('matrix') &&
      !key.includes('report')
    )
    .sort((a, b) => getMetricPriority(a[0]) - getMetricPriority(b[0]));
  
  const visualizationFiles = files.filter(file => isVisualizationFile(file.file_type));
  
  const downloadableFiles = files.filter(file => 
    file.file_type === 'model' || 
    file.file_type === 'report' || 
    file.file_type.includes('report') ||
    file.file_type.includes('model')
  );

  const formatTaskType = (type: string = '') => {
    if (!type) return "Unknown";
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Card className="w-full mt-6 border border-primary/20 rounded-lg shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">{experiment_name || 'Experiment Results'}</CardTitle>
          </div>
          
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {algorithm || automl_engine || formatTaskType(task_type)}
          </Badge>
        </div>
        
        <CardDescription className="flex flex-wrap gap-x-4 mt-2">
          <span className="inline-flex items-center">
            <Layers className="h-3.5 w-3.5 mr-1" />
            Task: <span className="font-semibold ml-1">{formatTaskType(task_type)}</span>
          </span>
          
          {target_column && (
            <span className="inline-flex items-center">
              <Activity className="h-3.5 w-3.5 mr-1" />
              Target: <span className="font-semibold ml-1">{target_column}</span>
            </span>
          )}
          
          {training_time_sec !== undefined && (
            <span className="inline-flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Time: <span className="font-semibold ml-1">{typeof training_time_sec === 'number' ? `${training_time_sec.toFixed(1)}s` : 'N/A'}</span>
            </span>
          )}
          
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
              <span>Details</span>
            </TabsTrigger>
            
            <TabsTrigger value="downloads" className="text-sm flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>Downloads</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="p-6">
            {sortedMetricEntries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {sortedMetricEntries.map(([key, value]) => {
                  const isPercentageMetric = [
                    'accuracy', 'f1_score', 'precision', 'recall', 'auc', 'roc_auc', 
                    'r2', 'r2_score'
                  ].some(m => key.toLowerCase().includes(m));
                  
                  const displayName = key.replace(/_/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                    
                  const numericValue = typeof value === 'number' ? value : 0;
                  
                  return (
                    <Card key={key} className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm capitalize">
                          {displayName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {isPercentageMetric
                            ? `${(numericValue * 100).toFixed(2)}%`
                            : numericValue.toFixed(4)}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground max-w-md mx-auto mt-2">
                No performance metrics were found for this experiment.
              </p>
            )}
            
            {isClassification && confusionMatrix.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">Confusion Matrix</h3>
                <div className="bg-muted/40 p-4 rounded-md overflow-x-auto">
                  <ConfusionMatrixTable 
                    matrix={confusionMatrix} 
                    classLabels={class_labels}
                  />
                </div>
              </div>
            )}
            
            {isClassification && classificationReport && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">Classification Report</h3>
                <div className="bg-muted/40 p-4 rounded-md overflow-x-auto">
                  <ClassificationReportTable report={classificationReport} />
                </div>
              </div>
            )}
            
            {yTrue.length > 0 && yPred.length > 0 && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Predictions vs Actual</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowFullPredictions(!showFullPredictions)}
                  >
                    {showFullPredictions ? "Show Less" : "Show All"}
                  </Button>
                </div>
                <div className="bg-muted/40 p-4 rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Index</TableHead>
                        <TableHead>Actual</TableHead>
                        <TableHead>Predicted</TableHead>
                        {isClassification && yProbs.length > 0 && (
                          <TableHead>Confidence</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(showFullPredictions ? yTrue : yTrue.slice(0, 10)).map((actualValue, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{index}</TableCell>
                          <TableCell>{String(actualValue)}</TableCell>
                          <TableCell>{String(yPred[index])}</TableCell>
                          {isClassification && yProbs.length > 0 && (
                            <TableCell>
                              {Array.isArray(yProbs[index]) 
                                ? `${(Math.max(...(yProbs[index] as number[])) * 100).toFixed(2)}%` 
                                : typeof yProbs[index] === 'number'
                                  ? `${(yProbs[index] as number * 100).toFixed(2)}%`
                                  : 'N/A'}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {!showFullPredictions && yTrue.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing 10 of {yTrue.length} predictions. Click "Show All" to view more.
                    </p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="visualizations" className="p-6">
            {visualizationFiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {visualizationFiles.map((file, index) => (
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
                            <p className="text-sm font-medium capitalize">
                              {file.file_type.replace(/_/g, ' ')}
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
                            {file.file_type.replace(/_/g, ' ')}
                          </h3>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={file.file_url} download={file.file_name || `${file.file_type}.png`} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Download this visualization</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Visualizations Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  No visualizations were found for this experiment.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="details" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Experiment Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-mono text-xs">{experimentId || 'N/A'}</span>
                      
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{experiment_name || 'Unnamed Experiment'}</span>
                      
                      <span className="text-muted-foreground">Algorithm:</span>
                      <span className="font-medium">{algorithm || automl_engine || 'Unknown'}</span>
                      
                      <span className="text-muted-foreground">Task Type:</span>
                      <span className="font-medium">{formatTaskType(task_type)}</span>
                      
                      <span className="text-muted-foreground">Target Column:</span>
                      <span className="font-medium">{target_column || 'N/A'}</span>
                      
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium">{created_at ? new Date(created_at).toLocaleString() : 'N/A'}</span>
                      
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="font-medium">{completed_at ? new Date(completed_at).toLocaleString() : 'N/A'}</span>
                      
                      <span className="text-muted-foreground">Training Time:</span>
                      <span className="font-medium">{training_time_sec ? `${training_time_sec.toFixed(2)}s` : 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {columns_to_keep && columns_to_keep.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Feature Columns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {columns_to_keep.map((column, index) => (
                        <Badge key={index} variant="secondary" className="bg-primary/5">
                          {column}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {hyperparameters && Object.keys(hyperparameters).length > 0 && (
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
          
          <TabsContent value="downloads" className="p-6">
            {downloadableFiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {downloadableFiles.map((file, index) => {
                  const displayName = file.file_type
                    .replace(/_/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                    
                  return (
                    <Card key={index} className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base capitalize">{displayName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button asChild className="w-full">
                          <a href={file.file_url} download={file.file_name || `${file.file_type}.file`} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" /> 
                            Download {file.file_name || displayName}
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Downloads Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  No downloadable artifacts were found for this experiment.
                </p>
              </div>
            )}
            
            {files.length > downloadableFiles.length && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">All Files</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Type</TableHead>
                      <TableHead>Download</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file, index) => (
                      <TableRow key={index}>
                        <TableCell className="capitalize">{file.file_type.replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <a href={file.file_url} download={file.file_name || `${file.file_type}.file`} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        {onReset && (
          <Button variant="outline" onClick={onReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Run New Experiment
          </Button>
        )}
        
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} className="ml-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Results
          </Button>
        )}
        
        {experimentResults.completed_at && (
          <div className="text-xs text-muted-foreground flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Completed: {new Date(experimentResults.completed_at).toLocaleString()}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ExperimentResults;
