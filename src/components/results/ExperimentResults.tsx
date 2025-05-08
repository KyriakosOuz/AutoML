import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Award, 
  BarChart4, 
  Clock, 
  DownloadCloud, 
  FileText, 
  RefreshCw, 
  Layers,
  Settings,
  Activity,
  Loader,
  Image as ImageIcon,
  AlertTriangle,
  Download
} from 'lucide-react';
import { ExperimentStatus } from '@/contexts/training/types';
import { ExperimentResults as ExperimentResultsType } from '@/types/training';
import ClassificationReportTable from '../training/ClassificationReportTable';
import { formatTrainingTime } from '@/utils/formatUtils';
import CSVPreview from './CSVPreview';

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
  const [csvPreviewOpen, setCsvPreviewOpen] = useState<boolean>(false);
  const [readmePreviewOpen, setReadmePreviewOpen] = useState<boolean>(false);
  const { toast } = useToast();

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
  
  const formatMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return (value >= 0 && value <= 1) ? (value * 100).toFixed(2) + '%' : value.toFixed(4);
  };
  
  const getMetricColor = (value: number | undefined) => {
    if (value === undefined) return 'text-gray-400';
    if (value >= 0.9) return 'text-green-600';
    if (value >= 0.7) return 'text-emerald-600';
    if (value >= 0.5) return 'text-amber-600';
    return 'text-red-600';
  };

  const isVisualizationFile = (fileType: string) => {
    // First check if we should exclude this file type
    if (fileType.includes('label_encoder')) {
      return false;
    }
    
    // Then check if it's a visualization file type
    const visualTypes = [
      'distribution', 
      'shap', 
      'confusion_matrix', 
      'importance', 
      'plot', 
      'chart', 
      'graph', 
      'visualization',
      'evaluation_curve',
      'learning_curve'
    ];
    return visualTypes.some(type => fileType.includes(type));
  };
  
  const getDownloadableFiles = () => {
    if (!experimentResults) return [];
    
    return experimentResults.files.filter(file => 
      file.file_type === 'model' || 
      file.file_type === 'report' || 
      file.file_type.includes('report')
    );
  };

  const getReadmeFile = () => {
    if (!experimentResults) return null;
    
    return experimentResults.files.find(file => 
      file.file_type === 'readme' || 
      file.file_type.includes('README') ||
      file.file_name?.toLowerCase().includes('readme')
    );
  };

  const getCsvFile = () => {
    if (!experimentResults) return null;
    
    return experimentResults.files.find(file => 
      file.file_type === 'predictions_csv' || 
      file.file_type.includes('predictions') ||
      (file.file_name && file.file_name.endsWith('.csv'))
    );
  };
  
  // Find the model file (if available)
  const getModelFile = () => {
    if (!experimentResults) return null;
    
    return experimentResults.files.find(file => 
      file.file_type === 'model' || 
      file.file_type.includes('model') ||
      file.file_name?.includes('.pkl')
    );
  };
  
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
    experiment_id,
    experiment_name,
    task_type,
    algorithm,
    automl_engine,
    target_column,
    hyperparameters,
    training_time_sec,
    created_at,
    completed_at,
    training_type
  } = experimentResults;
  
  const metrics = experimentResults.metrics || {};
  const files = experimentResults.files || [];
  const visualizationFiles = files.filter(file => isVisualizationFile(file.file_type));
  const readmeFile = getReadmeFile();
  const csvFile = getCsvFile();
  const modelFile = getModelFile();
  
  const classificationReport = metrics.classification_report && 
    (typeof metrics.classification_report === 'string' || typeof metrics.classification_report === 'object') 
      ? metrics.classification_report 
      : null;

  return (
    <Card className="w-full mt-6 border border-primary/20 rounded-lg shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">{experiment_name || 'Experiment Results'}</CardTitle>
          </div>
          
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {training_type === 'automl' || automl_engine 
              ? `Engine: ${automl_engine?.toUpperCase() || 'AutoML'}` 
              : `Algorithm: ${algorithm || 'Auto-selected'}`}
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
          
          {training_time_sec && (
            <span className="inline-flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Time: <span className="font-semibold ml-1">{formatTrainingTime(training_time_sec)}</span>
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
              <DownloadCloud className="h-4 w-4" />
              <span>Downloads</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="p-6">
            {Object.keys(metrics).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(metrics).map(([key, value]) => {
                  if (
                    key === 'classification_report'
                  ) {
                    return null;
                  }
                  if (typeof value !== 'number') return null;
                  const isPercentageMetric = ['accuracy', 'f1', 'precision', 'recall', 'auc', 'r2'].some(m => 
                    key.toLowerCase().includes(m)
                  );
                  return (
                    <Card key={key} className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm capitalize">
                          {key.replace(/_/g, ' ')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {isPercentageMetric
                            ? `${(value * 100).toFixed(2)}%`
                            : value.toFixed(4)}
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
            {classificationReport && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">Classification Report</h3>
                <div className="bg-muted/40 p-4 rounded-md overflow-x-auto">
                  <ClassificationReportTable report={classificationReport} />
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
                                  <a href={file.file_url} download={file.file_name} target="_blank" rel="noopener noreferrer">
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
                  No visualizations were found for this experiment.
                </p>
              </div>
            )}

            {readmeFile && (
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Documentation</CardTitle>
                    <CardDescription>
                      README file containing experiment details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      onClick={() => setReadmePreviewOpen(true)}
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View README
                    </Button>
                  </CardContent>
                </Card>

                <Dialog open={readmePreviewOpen} onOpenChange={setReadmePreviewOpen}>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <div className="p-4">
                      <h2 className="text-xl font-bold mb-4">README</h2>
                      <div className="bg-muted p-4 rounded-md overflow-x-auto">
                        <iframe 
                          src={readmeFile.file_url} 
                          className="w-full h-[50vh]" 
                          title="README"
                        />
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button variant="outline" asChild>
                          <a href={readmeFile.file_url} download target="_blank" rel="noopener noreferrer">
                            <DownloadCloud className="h-4 w-4 mr-2" />
                            Download README
                          </a>
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex flex-col space-y-2">
                      <div>
                        <span className="text-sm text-muted-foreground">Experiment ID:</span>
                        <span className="text-sm font-medium ml-2">
                          {experiment_id?.substring(0, 8)}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Task Type:</span>
                        <span className="text-sm font-medium ml-2">
                          {formatTaskType(task_type)}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Algorithm:</span>
                        <span className="text-sm font-medium ml-2">
                          {algorithm || 'Auto-selected'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Target Column:</span>
                        <span className="text-sm font-medium ml-2">
                          {target_column}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Training Time:</span>
                        <span className="text-sm font-medium ml-2">
                          {formatTrainingTime(training_time_sec)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {hyperparameters && Object.keys(hyperparameters).length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Parameters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/30 p-3 rounded-md">
                      {Object.entries(hyperparameters).slice(0, 8).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-2 gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">{key}:</span>
                          <span className="text-xs font-medium truncate">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {modelFile && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Download Model</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <a href={modelFile.file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download Model
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="downloads" className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {getDownloadableFiles().map((file, index) => (
                <Card key={index} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base capitalize">{file.file_type.replace(/_/g, ' ')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <a href={file.file_url} download={file.file_name} target="_blank" rel="noopener noreferrer">
                        <DownloadCloud className="h-4 w-4 mr-2" /> 
                        Download {file.file_name}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {csvFile && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Predictions CSV</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <CSVPreview
                        fileUrl={csvFile.file_url}
                        downloadUrl={csvFile.file_url}
                        maxRows={10}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
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
            {new Date(completed_at).toLocaleString()}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ExperimentResults;

// Remove this duplicate function at the end of the file as it's not needed
// function isVisualizationFile(type: string) {
//   return !type.includes('model') && !type.includes('report');
// }
