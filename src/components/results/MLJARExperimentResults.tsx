import React, { useState, useEffect } from 'react';
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
  Image as ImageIcon,
  FileJson,
  Files
} from 'lucide-react';
import { ExperimentResults } from '@/types/training';
import { ExperimentStatus } from '@/contexts/training/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownRenderer from '@/components/ui/markdown-renderer';

interface MLJARExperimentResultsProps {
  experimentId: string | null;
  status: ExperimentStatus;
  experimentResults: ExperimentResults | null;
  isLoading: boolean;
  error: string | null;
  onReset?: () => void;
  onRefresh?: () => void;
}

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

// Helper functions to identify file types
const isVisualizationFile = (file: any) => {
  const visualTypes = [
    'confusion_matrix', 
    'roc_curve', 
    'precision_recall', 
    'learning_curve', 
    'feature_importance',
    'calibration',
    'lift',
    'gains',
    'metrics_summary',
    'shap'
  ];
  
  return (
    (visualTypes.some(type => file.file_type.toLowerCase().includes(type)) || 
    file.file_type.toLowerCase().includes('plot') ||
    file.file_type.toLowerCase().includes('chart') ||
    file.file_type.toLowerCase().includes('graph') ||
    file.file_type.toLowerCase().includes('visualization')) && 
    !file.file_type.toLowerCase().includes('model') && 
    !file.file_type.toLowerCase().includes('report') &&
    !file.file_type.toLowerCase().includes('csv') &&
    !file.file_type.toLowerCase().includes('json') &&
    !file.file_type.toLowerCase().includes('md')
  );
};

const isDocumentationFile = (file: any) => {
  return file.file_type.includes('readme') || 
         file.file_type.includes('md') || 
         file.file_type.includes('documentation');
};

const isDataFile = (file: any) => {
  return file.file_type.includes('csv') || 
         file.file_type.includes('predictions');
};

const isMetadataFile = (file: any) => {
  return file.file_type.includes('json') || 
         file.file_type.includes('metadata') ||
         file.file_type.includes('config');
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
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [jsonContent, setJsonContent] = useState<any>(null);
  const [selectedDocFile, setSelectedDocFile] = useState<any>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  
  // Loading states for different content
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  const [isLoadingJson, setIsLoadingJson] = useState(false);
  
  // Fetch file content based on type
  const fetchFileContent = async (file: any, type: 'markdown' | 'csv' | 'json') => {
    if (!file) return;
    
    try {
      // Set the correct loading state
      if (type === 'markdown') setIsLoadingDoc(true);
      if (type === 'csv') setIsLoadingCsv(true);
      if (type === 'json') setIsLoadingJson(true);
      
      const response = await fetch(file.file_url);
      
      if (type === 'markdown') {
        const text = await response.text();
        setMarkdownContent(text);
        setSelectedDocFile(file);
      }
      
      else if (type === 'csv') {
        const text = await response.text();
        // Simple CSV parsing - split by lines first, then by commas
        const lines = text.split('\n');
        const parsedData = lines.map(line => line.split(','));
        setCsvData(parsedData.slice(0, 100)); // Limit to first 100 rows for performance
      }
      
      else if (type === 'json') {
        const json = await response.json();
        setJsonContent(json);
      }
    } catch (error) {
      console.error(`Error fetching ${type} file:`, error);
    } finally {
      // Reset the correct loading state
      if (type === 'markdown') setIsLoadingDoc(false);
      if (type === 'csv') setIsLoadingCsv(false);
      if (type === 'json') setIsLoadingJson(false);
    }
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
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
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
  
  // Filter files by type
  const visualizationFiles = files.filter(isVisualizationFile);
  const documentationFiles = files.filter(isDocumentationFile);
  const dataFiles = files.filter(isDataFile);
  const metadataFiles = files.filter(isMetadataFile);
  
  const readmeFile = documentationFiles.find(file => 
    file.file_type.includes('readme') || 
    file.file_type.includes('README.md')
  );
  
  const predictionsFile = dataFiles.find(file => 
    file.file_type.includes('predictions') ||
    file.file_type.includes('csv')
  );
  
  const modelMetadataFile = metadataFiles.find(file => 
    file.file_type.includes('model_metadata') || 
    file.file_type.includes('ensemble.json')
  );

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
          <TabsList className="w-full grid grid-cols-5 rounded-none border-b h-12">
            <TabsTrigger value="summary" className="text-sm flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span>Summary</span>
            </TabsTrigger>
            
            <TabsTrigger value="charts" className="text-sm flex items-center gap-1">
              <BarChart4 className="h-4 w-4" />
              <span>Charts</span>
            </TabsTrigger>
            
            <TabsTrigger value="data" className="text-sm flex items-center gap-1">
              <Files className="h-4 w-4" />
              <span>Predictions</span>
            </TabsTrigger>
            
            <TabsTrigger value="docs" className="text-sm flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Documentation</span>
            </TabsTrigger>
            
            <TabsTrigger value="metadata" className="text-sm flex items-center gap-1">
              <FileJson className="h-4 w-4" />
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
                    
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {Object.entries(metrics).map(([key, value]) => {
                        if (
                          key === 'best_model_label' ||
                          key === 'metric_used' ||
                          key === 'metric_value' ||
                          key === 'classification_report' ||
                          key === 'confusion_matrix' ||
                          typeof value !== 'number'
                        ) return null;
                        
                        return (
                          <div key={key}>
                            <span className="text-sm text-muted-foreground">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="text-sm font-medium ml-2">
                              {formatMetric(value as number)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
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
                            {formatChartName(file.file_type)}
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
                        <DialogTitle>{formatChartName(file.file_type)}</DialogTitle>
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
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Charts Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  No visualization files were found for this experiment.
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* Predictions/Data Tab */}
          <TabsContent value="data" className="p-6">
            {predictionsFile ? (
              <Card>
                <CardHeader>
                  <CardTitle>Model Predictions</CardTitle>
                  <CardDescription>
                    Preview of predictions made by the MLJAR model
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Button 
                      onClick={() => fetchFileContent(predictionsFile, 'csv')} 
                      disabled={isLoadingCsv}
                      variant="outline"
                      className="mb-4"
                    >
                      {isLoadingCsv ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Loading CSV...
                        </>
                      ) : (
                        <>
                          <Files className="h-4 w-4 mr-2" />
                          Preview Predictions
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {csvData.length > 0 ? (
                    <ScrollArea className="h-[400px] border rounded-md">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {csvData[0] && csvData[0].map((header, i) => (
                                <TableHead key={i} className="whitespace-nowrap font-medium">{header}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {csvData.slice(1, 50).map((row, i) => (
                              <TableRow key={i}>
                                {row.map((cell, j) => (
                                  <TableCell key={j}>{cell}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 border rounded-md bg-muted/20">
                      <Files className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Click "Preview Predictions" to load prediction data
                      </p>
                    </div>
                  )}
                  
                  {csvData.length > 50 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing first 50 rows of {csvData.length} total rows
                    </p>
                  )}
                  
                  <div className="mt-6">
                    <Button asChild className="w-full">
                      <a href={predictionsFile.file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download Predictions CSV
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12">
                <Files className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Predictions Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  No predictions file was found for this experiment.
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* Documentation Tab */}
          <TabsContent value="docs" className="p-6">
            {documentationFiles.length > 0 ? (
              <>
                {readmeFile ? (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>README Documentation</CardTitle>
                      <CardDescription>
                        Automatically generated documentation for the model
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <Button 
                          onClick={() => fetchFileContent(readmeFile, 'markdown')} 
                          disabled={isLoadingDoc}
                          variant="outline"
                          className="mb-4"
                        >
                          {isLoadingDoc ? (
                            <>
                              <Loader className="h-4 w-4 mr-2 animate-spin" />
                              Loading README...
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 mr-2" />
                              View README
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {markdownContent ? (
                        <div className="border rounded-md p-4 bg-card">
                          <ScrollArea className="h-[500px]">
                            <MarkdownRenderer content={markdownContent} />
                          </ScrollArea>
                        </div>
                      ) : (
                        <div className="text-center py-8 border rounded-md bg-muted/20">
                          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">
                            Click "View README" to load the documentation
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-6">
                        <Button asChild variant="outline" className="w-full">
                          <a href={readmeFile.file_url} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download README
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
                
                {documentationFiles.length > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Documentation</CardTitle>
                      <CardDescription>
                        Other documentation files for the model
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-2">
                        {documentationFiles.filter(f => f !== readmeFile).map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                              <span className="font-medium">
                                {file.file_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </span>
                            </div>
                            <Button asChild variant="outline" size="sm">
                              <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Documentation Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  No documentation files were found for this experiment.
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* Model Details Tab */}
          <TabsContent value="metadata" className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
              {modelMetadataFile ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Model Metadata</CardTitle>
                    <CardDescription>
                      Technical details about the selected model
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <Button 
                        onClick={() => fetchFileContent(modelMetadataFile, 'json')} 
                        disabled={isLoadingJson}
                        variant="outline"
                        className="mb-4"
                      >
                        {isLoadingJson ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Loading JSON...
                          </>
                        ) : (
                          <>
                            <FileJson className="h-4 w-4 mr-2" />
                            View Metadata
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {jsonContent ? (
                      <div className="bg-muted p-4 rounded-md overflow-x-auto">
                        <ScrollArea className="h-[500px]">
                          <pre className="text-xs font-mono">
                            {JSON.stringify(jsonContent, null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>
                    ) : (
                      <div className="bg-muted p-4 rounded-md overflow-x-auto">
                        <pre className="text-xs font-mono">
                          {JSON.stringify(hyperparameters, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      <Button variant="outline" size="sm" asChild>
                        <a href={modelMetadataFile.file_url} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Download Metadata
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12">
                  <FileJson className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Model Metadata Available</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    No metadata files were found for this model.
                  </p>
                </div>
              )}
            </div>
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
          <Button variant="secondary" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Results
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default MLJARExperimentResults;
