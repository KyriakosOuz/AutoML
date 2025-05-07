
import React, { useState } from 'react';
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
  Image as ImageIcon, 
  DownloadCloud,
  Activity,
  LineChart,
  Table as TableIcon,
  FileText,
  Info,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw
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
import ClassificationReportTable from './ClassificationReportTable';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface CustomTrainingResultsProps {
  experimentResults: ExperimentResults;
  onReset: () => void;
}

const formatTime = (date: string) => {
  try {
    return new Date(date).toLocaleString();
  } catch (e) {
    return 'N/A';
  }
};

const formatDuration = (startDate: string, endDate: string) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMilliseconds = end.getTime() - start.getTime();
    
    // Calculate hours, minutes, seconds
    const hours = Math.floor(diffMilliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((diffMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMilliseconds % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  } catch (e) {
    return 'N/A';
  }
};

const CustomTrainingResults: React.FC<CustomTrainingResultsProps> = ({ 
  experimentResults, 
  onReset 
}) => {
  const [activeTab, setActiveTab] = useState('metrics');
  const [currentFilesPage, setCurrentFilesPage] = useState(1);
  const filesPerPage = 5;
  
  console.log('[CustomTrainingResults] Rendering with experiment results:', {
    experimentId: experimentResults.experiment_id,
    experimentName: experimentResults.experiment_name,
    taskType: experimentResults.task_type,
    hasMetrics: !!experimentResults.metrics,
    metricsKeys: Object.keys(experimentResults.metrics || {}),
    hasClassificationReport: experimentResults.metrics ? 
      'classification_report' in experimentResults.metrics : false
  });

  const { 
    experiment_id, 
    experiment_name, 
    target_column, 
    task_type = '', 
    metrics = {}, 
    files = [],
    algorithm,
    created_at,
    completed_at
  } = experimentResults;

  // Format chart display name - matching MLJARExperimentResults implementation
  const formatChartName = (fileType: string) => {
    if (fileType.includes('confusion_matrix')) {
      return fileType.includes('normalized') ? 'Normalized Confusion Matrix' : 'Confusion Matrix';
    } else if (fileType.includes('roc_curve')) {
      return 'ROC Curve';
    } else if (fileType.includes('precision_recall')) {
      return 'Precision-Recall Curve';
    } else if (fileType.includes('learning_curve')) {
      return 'Learning Curve';
    } else if (fileType.includes('evaluation')) {
      return 'Evaluation Curve';
    } else if (fileType.includes('feature_importance')) {
      return 'Feature Importance';
    } else if (fileType.includes('distribution')) {
      return 'Distribution Plot';
    }
    return fileType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Filter files to show only the first model file and hide label encoder files
  const filteredFiles = files.filter((file, index, self) => {
    // Exclude all label encoder files
    if (file.file_type.includes('label_encoder')) {
      return false;
    }

    // For model files, only include the first one
    if (file.file_type === 'model' || file.file_type.includes('model')) {
      // Get the index of the first model file
      const firstModelIndex = self.findIndex(f => 
        f.file_type === 'model' || f.file_type.includes('model')
      );
      // Only include if this is the first model file
      return index === firstModelIndex;
    }

    // Include all other files
    return true;
  });

  // Helper function to filter files by type and check for specific visualization types
  // Updated to match MLJARExperimentResults implementation for consistency
  const isVisualizationFile = (file: any) => {
    // Include all these visualization types
    const visualTypes = [
      'distribution', 'shap', 'confusion_matrix', 'importance', 
      'plot', 'chart', 'graph', 'visualization', 'roc_curve', 
      'precision_recall_curve', 'pr_curve', 'metrics_summary',
      'learning_curve', 'evaluation_curve', 'evaluation'
    ];
    // Exclude these file types
    const nonVisualTypes = ['model', 'report', 'label_encoder', 'ensemble', 'metadata', 'predictions'];
    
    // Return true if contains visual type and doesn't contain non-visual type
    return visualTypes.some(type => file.file_type.includes(type)) && 
           !nonVisualTypes.some(type => file.file_type.includes(type));
  };

  // Get model files - make sure to include only the first model file
  const firstModelFile = filteredFiles.find(file => 
    file.file_type === 'model' || file.file_type.includes('model')
  );
  
  // Get visualization files (excluding models and reports)
  const visualizationFiles = filteredFiles.filter(isVisualizationFile);

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
  
  // Check and log classification report if it exists
  if (metrics && metrics.classification_report) {
    console.log('[CustomTrainingResults] Classification report type:', typeof metrics.classification_report);
    if (typeof metrics.classification_report === 'object') {
      console.log('[CustomTrainingResults] Classification report keys:', Object.keys(metrics.classification_report));
    }
  }

  // Calculate pagination for filtered files
  const totalFiles = filteredFiles.length;
  const totalFilesPages = Math.ceil(totalFiles / filesPerPage);
  
  // Get current page of filtered files
  const indexOfLastFile = currentFilesPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = filteredFiles.slice(indexOfFirstFile, indexOfLastFile);
  
  // Change page
  const goToFilesPage = (pageNumber: number) => {
    setCurrentFilesPage(pageNumber);
  };

  return (
    <Card className="shadow-lg border-primary/10 mt-6">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle>{experiment_name || 'Custom Training Results'}</CardTitle>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            {algorithm || formattedTaskType}
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
            {metrics.classification_report && (
              <TabsTrigger value="report" className="data-[state=active]:bg-primary/10">
                <TableIcon className="mr-1 h-4 w-4" />
                Classification Report
              </TabsTrigger>
            )}
            <TabsTrigger value="details" className="data-[state=active]:bg-primary/10">
              <Info className="mr-1 h-4 w-4" />
              Details
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                </>
              )}
              
              {isRegression && (
                <>
                  {metrics.r2 !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">R² Score</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.r2)}`}>
                          {formatRegressionMetric(metrics.r2)}
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
                  
                  {metrics.mse !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Mean Squared Error</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">
                          {formatRegressionMetric(metrics.mse)}
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
              
              {/* Add Download Model Button as a card */}
              {firstModelFile && (
                <Card className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">Download Model</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Button 
                      className="w-full" 
                      asChild
                    >
                      <a href={firstModelFile.file_url} download target="_blank" rel="noopener noreferrer">
                        <DownloadCloud className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="visualizations" className="p-6">
            {visualizationFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visualizationFiles.map((file, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <Card className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                        <CardHeader className="py-2 px-4 bg-muted/30">
                          <CardTitle className="text-sm font-medium">
                            {formatChartName(file.file_type)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="aspect-video bg-muted flex flex-col items-center justify-center rounded-md relative overflow-hidden">
                            <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${file.file_url})` }}></div>
                            <div className="absolute inset-0 bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">
                              <ImageIcon className="h-8 w-8 text-white drop-shadow-md" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <div className="p-1">
                        <img 
                          src={file.file_url} 
                          alt={formatChartName(file.file_type)} 
                          className="w-full rounded-md"
                        />
                        <div className="mt-2 flex justify-between items-center">
                          <h3 className="font-medium">
                            {formatChartName(file.file_type)}
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
                  Visualizations may not be available for this model or are still being generated.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="report" className="p-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Classification Report</CardTitle>
                <CardDescription>
                  Detailed metrics breakdown by class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClassificationReportTable report={metrics.classification_report} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="details" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Experiment Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Experiment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Experiment ID:</span>
                      <span className="font-mono">{experiment_id}</span>
                      
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{experiment_name}</span>
                      
                      <span className="text-muted-foreground">Algorithm:</span>
                      <span className="font-medium">{algorithm || 'Not specified'}</span>
                      
                      <span className="text-muted-foreground">Task Type:</span>
                      <span className="font-medium">{formattedTaskType}</span>
                      
                      <span className="text-muted-foreground">Target Column:</span>
                      <span className="font-medium">{target_column}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Timing Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Timing Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        Created:
                      </div>
                      <span>{formatTime(created_at)}</span>
                      
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        Completed:
                      </div>
                      <span>{completed_at ? formatTime(completed_at) : 'N/A'}</span>
                      
                      {created_at && completed_at && (
                        <>
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="mr-2 h-4 w-4" />
                            Duration:
                          </div>
                          <span>{formatDuration(created_at, completed_at)}</span>
                        </>
                      )}
                      
                      {experimentResults.training_time_sec !== undefined && (
                        <>
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="mr-2 h-4 w-4" />
                            Training Time:
                          </div>
                          <span>{experimentResults.training_time_sec.toFixed(2)} seconds</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Hyperparameters */}
              {experimentResults.hyperparameters && Object.keys(experimentResults.hyperparameters).length > 0 && (
                <Card className="md:col-span-2">
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
                        {Object.entries(experimentResults.hyperparameters).map(([key, value]) => (
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
              
              {/* Files Information */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Created At</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentFiles.map((file, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {formatChartName(file.file_type)}
                            </TableCell>
                            <TableCell>{formatTime(file.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" asChild>
                                <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                                  <DownloadCloud className="h-3 w-3 mr-1" />
                                  Download
                                </a>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination for files */}
                  {totalFiles > filesPerPage && (
                    <div className="mt-4">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => goToFilesPage(Math.max(1, currentFilesPage - 1))}
                              className={currentFilesPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: Math.min(totalFilesPages, 5) }).map((_, i) => {
                            // Logic for showing pages
                            let pageNumber;
                            if (totalFilesPages <= 5) {
                              // If 5 or fewer pages, show all page numbers
                              pageNumber = i + 1;
                            } else if (currentFilesPage <= 3) {
                              // If near start, show first 5 pages
                              pageNumber = i + 1;
                            } else if (currentFilesPage >= totalFilesPages - 2) {
                              // If near end, show last 5 pages
                              pageNumber = totalFilesPages - 4 + i;
                            } else {
                              // Otherwise show current page and 2 on each side
                              pageNumber = currentFilesPage - 2 + i;
                            }
                            
                            return (
                              <PaginationItem key={i}>
                                <PaginationLink
                                  isActive={currentFilesPage === pageNumber}
                                  onClick={() => goToFilesPage(pageNumber)}
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          
                          {/* Show ellipsis if there are more than 5 pages and we're not showing the last pages */}
                          {totalFilesPages > 5 && currentFilesPage < totalFilesPages - 2 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => goToFilesPage(Math.min(totalFilesPages, currentFilesPage + 1))}
                              className={currentFilesPage === totalFilesPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                      
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Showing {indexOfFirstFile + 1}-{Math.min(indexOfLastFile, totalFiles)} of {totalFiles} files
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

export default CustomTrainingResults;
