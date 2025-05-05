
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
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
  FileText, 
  DownloadCloud,
  Activity,
  Layers,
  Clock,
  Info,
  Image as ImageIcon
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
import { ExperimentResults } from '@/types/training';

interface AutoMLResultsProps {
  experimentResults: ExperimentResults;
  onReset?: () => void;
}

const AutoMLResults: React.FC<AutoMLResultsProps> = ({ 
  experimentResults, 
  onReset 
}) => {
  const [activeTab, setActiveTab] = useState('metrics');
  
  console.log('[AutoMLResults] Rendering with experiment results:', {
    experimentId: experimentResults.experiment_id,
    experimentName: experimentResults.experiment_name,
    taskType: experimentResults.task_type,
    hasMetrics: !!experimentResults.metrics,
    metricsKeys: Object.keys(experimentResults.metrics || {})
  });

  const { 
    experiment_id, 
    experiment_name,
    target_column, 
    task_type = '',
    metrics = {}, 
    files = [],
    algorithm,
    training_time_sec,
    created_at,
    completed_at,
    automl_engine
  } = experimentResults;

  // Helper function to filter files by type
  const isVisualizationFile = (file: any) => {
    const visualTypes = ['distribution', 'shap', 'confusion_matrix', 'importance', 'plot', 'chart', 'graph', 'visualization', 'roc_curve', 'precision_recall', 'learning_curve', 'calibration', 'lift', 'gains'];
    return visualTypes.some(type => file.file_type.includes(type)) && 
           !file.file_type.includes('model') && 
           !file.file_type.includes('report');
  };

  // Get model files
  const allModelFiles = files.filter(file => file.file_type === 'model' || file.file_type.includes('model'));
  const modelFile = allModelFiles.length > 0 ? allModelFiles[0] : null;
  
  // Get visualization files
  const visualizationFiles = files.filter(isVisualizationFile);

  // Get downloadable files
  const downloadableFiles = files.filter(file => 
    file.file_type === 'model' || 
    file.file_type.includes('predictions') || 
    file.file_type.includes('readme') || 
    file.file_type.includes('summary') ||
    isVisualizationFile(file)
  );

  // Check if task_type exists before using it
  const isClassification = task_type ? task_type.includes('classification') : false;
  const isRegression = task_type ? task_type.includes('regression') : false;
  
  const formatMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return typeof value === 'number' ? (value * 100).toFixed(2) + '%' : String(value);
  };
  
  const formatRegressionMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return typeof value === 'number' ? value.toFixed(4) : String(value);
  };
  
  const getMetricColor = (value: number | undefined) => {
    if (value === undefined) return 'text-gray-400';
    if (value >= 0.9) return 'text-green-600';
    if (value >= 0.7) return 'text-emerald-600';
    if (value >= 0.5) return 'text-amber-600';
    return 'text-red-600';
  };

  // Format task type for display with null check
  const formattedTaskType = task_type ? task_type.replace(/_/g, ' ') : 'unknown task';
  
  // Format timestamp
  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle>{experiment_name || 'AutoML Results'}</CardTitle>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            {automl_engine || 'AutoML'} {algorithm ? `- ${algorithm}` : ''}
          </Badge>
        </div>
        <CardDescription>
          Target: <span className="font-medium">{target_column}</span> • 
          Task: <span className="font-medium">{formattedTaskType}</span> • 
          ID: <span className="font-mono text-xs">{experiment_id}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b px-4">
            <TabsTrigger value="metrics" className="data-[state=active]:bg-primary/10">
              <Activity className="mr-1 h-4 w-4" /> 
              Metrics
            </TabsTrigger>
            <TabsTrigger value="visualizations" className="data-[state=active]:bg-primary/10">
              <BarChart4 className="mr-1 h-4 w-4" />
              Visualizations
            </TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-primary/10">
              <Info className="mr-1 h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="downloads" className="data-[state=active]:bg-primary/10">
              <DownloadCloud className="mr-1 h-4 w-4" />
              Downloads
            </TabsTrigger>
          </TabsList>
          
          {/* Metrics Tab */}
          <TabsContent value="metrics" className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {isClassification && (
                <>
                  {metrics.accuracy !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Accuracy</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.accuracy)}`}>
                          {formatMetric(metrics.accuracy)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.f1_score !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">F1 Score</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.f1_score)}`}>
                          {formatMetric(metrics.f1_score)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.precision !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Precision</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.precision)}`}>
                          {formatMetric(metrics.precision)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.recall !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Recall</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.recall)}`}>
                          {formatMetric(metrics.recall)}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {metrics.auc !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">AUC</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.auc)}`}>
                          {formatMetric(metrics.auc)}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {metrics.log_loss !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Log Loss</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">
                          {formatRegressionMetric(metrics.log_loss)}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {metrics.mcc !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">MCC</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.mcc)}`}>
                          {formatMetric(metrics.mcc)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
              
              {isRegression && (
                <>
                  {metrics.r2_score !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">R² Score</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.r2_score)}`}>
                          {formatRegressionMetric(metrics.r2_score)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.mae !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Mean Absolute Error</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">
                          {formatRegressionMetric(metrics.mae)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.rmse !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Root Mean Squared Error</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">
                          {formatRegressionMetric(metrics.rmse)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>

            {/* Confusion Matrix if available */}
            {metrics.confusion_matrix && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Confusion Matrix</h3>
                <div className="overflow-x-auto bg-muted/20 p-4 rounded-md">
                  {typeof metrics.confusion_matrix === 'string' ? (
                    <pre className="text-xs font-mono">{metrics.confusion_matrix}</pre>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Actual / Predicted</TableHead>
                          {Array.isArray(metrics.confusion_matrix[0]) && 
                            metrics.confusion_matrix[0].map((_, index) => (
                              <TableHead key={index}>Class {index}</TableHead>
                            ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(metrics.confusion_matrix) && 
                          metrics.confusion_matrix.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              <TableCell>Class {rowIndex}</TableCell>
                              {Array.isArray(row) && 
                                row.map((cell, cellIndex) => (
                                  <TableCell key={cellIndex}>{cell}</TableCell>
                                ))}
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Visualizations Tab */}
          <TabsContent value="visualizations" className="p-6">
            {visualizationFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visualizationFiles.map((file, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <Card className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="aspect-video bg-muted flex flex-col items-center justify-center rounded-md relative overflow-hidden">
                            <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${file.file_url})` }}></div>
                            <div className="absolute inset-0 bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">
                              <ImageIcon className="h-8 w-8 text-white drop-shadow-md" />
                            </div>
                          </div>
                          <div className="mt-3 text-center">
                            <h3 className="font-medium text-sm">
                              {file.file_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </h3>
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
                            {file.file_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </h3>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                                    <DownloadCloud className="h-4 w-4 mr-1" />
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
                  No visualizations were generated for this AutoML experiment.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="p-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Experiment Details</CardTitle>
                <CardDescription>
                  Metadata about this AutoML experiment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Experiment Name</span>
                      <span className="font-medium">{experiment_name}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Training Type</span>
                      <span className="font-medium">AutoML</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Engine</span>
                      <span className="font-medium">{automl_engine || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Task Type</span>
                      <span className="font-medium">{formattedTaskType}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Target Column</span>
                      <span className="font-medium">{target_column}</span>
                    </div>
                    {training_time_sec && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Training Time</span>
                        <span className="font-medium">{training_time_sec.toFixed(1)} seconds</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Created At</span>
                      <span className="font-medium">{formatTimestamp(created_at)}</span>
                    </div>
                    {completed_at && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Completed At</span>
                        <span className="font-medium">{formatTimestamp(completed_at)}</span>
                      </div>
                    )}
                    {algorithm && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Best Model</span>
                        <span className="font-medium">{algorithm}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional details like hyperparameters if available */}
                {experimentResults.hyperparameters && Object.keys(experimentResults.hyperparameters).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Hyperparameters</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parameter</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(experimentResults.hyperparameters).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell>{key}</TableCell>
                            <TableCell>
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Downloads Tab */}
          <TabsContent value="downloads" className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {downloadableFiles.length > 0 ? (
                downloadableFiles.map((file, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">
                        {file.file_type.includes('model') ? (
                          <>
                            <FileText className="h-4 w-4 inline mr-2" />
                            Model File
                          </>
                        ) : file.file_type.includes('predictions') ? (
                          <>
                            <FileText className="h-4 w-4 inline mr-2" />
                            Predictions
                          </>
                        ) : file.file_type.includes('readme') ? (
                          <>
                            <FileText className="h-4 w-4 inline mr-2" />
                            README
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-4 w-4 inline mr-2" />
                            {file.file_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {file.file_name || file.file_type}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Button variant="secondary" className="w-full" asChild>
                        <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                          <DownloadCloud className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <DownloadCloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Downloads Available</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    No downloadable files were found for this experiment.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AutoMLResults;
