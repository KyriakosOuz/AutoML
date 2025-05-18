import React, { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trainingApi } from "@/lib/api";
import { Experiment } from '@/types/api';
import { ExperimentResults } from '@/types/training';
import { 
  Award, 
  BarChart2, 
  CheckCircle2, 
  Clock, 
  Database, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Loader2, 
  Table as TableIcon,
  RefreshCw,
  XCircle,
  Image as ImageIcon,
  Info
} from 'lucide-react';
import { formatDateForGreece } from '@/lib/dateUtils';
import { formatTrainingTime } from '@/utils/formatUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CSVPreview from '../results/CSVPreview';
import VisualizationDisplay from '../results/VisualizationDisplay';

interface ExperimentDetailDrawerProps {
  experiment: Experiment | null;
  isOpen: boolean;
  onClose: () => void;
}

const ExperimentDetailDrawer: React.FC<ExperimentDetailDrawerProps> = ({ experiment, isOpen, onClose }) => {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ExperimentResults | null>(null);
  
  useEffect(() => {
    if (isOpen && experiment) {
      fetchExperimentResults(experiment.id);
    }
  }, [isOpen, experiment]);
  
  const fetchExperimentResults = async (experimentId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await trainingApi.getExperimentResults(experimentId);
      console.log("Fetched experiment results:", response);
      setResults(response);
    } catch (err: any) {
      console.error("Failed to fetch experiment results:", err);
      setError(err.message || "Failed to fetch experiment results");
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = () => {
    if (experiment) {
      fetchExperimentResults(experiment.id);
    }
  };
  
  const handleDownloadTrainedModel = () => {
    if (results?.model_file_url) {
      window.open(results.model_file_url, '_blank');
    }
  };

  const handleDownloadReport = () => {
    if (results?.report_file_url) {
      window.open(results.report_file_url, '_blank');
    }
  };
  
  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'secondary';
      case 'failed':
      case 'error':
        return 'destructive';
      case 'running':
      case 'processing':
        return 'default';
      default:
        return 'outline';
    }
  };
  
  const formatTaskType = (type: string = '') => {
    if (!type) return "N/A";
    
    switch (type.toLowerCase()) {
      case 'binary_classification':
        return 'Binary Classification';
      case 'multiclass_classification':
        return 'Multiclass Classification';
      case 'regression':
        return 'Regression';
      default:
        return type;
    }
  };
  
  const formatMetricValue = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return (value * 100).toFixed(2) + '%';
  };
  
  const formatRegressionMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return value.toFixed(4);
  };
  
  // Helper function to check if a metric should be displayed as percentage
  const isPercentMetric = (name: string): boolean => {
    return ['accuracy', 'precision', 'recall', 'f1', 'specificity', 'auc'].some(m => 
      name.toLowerCase().includes(m)
    );
  };
  
  // Filter out duplicate metrics for H2O binary experiments
  const getUniqueMetrics = (metrics: Record<string, any> = {}): { key: string, label: string, value: string }[] => {
    if (!metrics || Object.keys(metrics).length === 0) return [];
    
    const filteredMetrics: { key: string, label: string, value: string }[] = [];
    const usedKeys = new Set<string>();
    
    // Process each metric
    for (const [key, value] of Object.entries(metrics)) {
      // Skip metrics that should be excluded or already processed
      if (key === 'per_class' || key === 'classification_report' || key === 'confusion_matrix' || 
          key === 'source' || typeof value !== 'number') {
        continue;
      }
      
      // Handle special case for H2O binary experiments with duplicate specificity
      if (experiment?.automl_engine === 'h2o' && 
          experiment?.task_type === 'binary_classification' && 
          key === 'specificity') {
        if (usedKeys.has(key)) {
          continue; // Skip duplicate specificity
        }
      }
      
      // Add the key to processed set
      usedKeys.add(key);
      
      // Format the label
      const label = key
        .replace(/_/g, ' ')
        .replace(/\bmse\b/i, 'MSE')
        .replace(/\brmse\b/i, 'RMSE')
        .replace(/\bmae\b/i, 'MAE')
        .replace(/\br2\b/i, 'R²')
        .replace(/\bauc\b/i, 'AUC')
        .replace(/\bmape\b/i, 'MAPE')
        .replace(/\baucpr\b/i, 'AUCPR')
        .replace(/\bmean_per_class_error\b/i, 'MPCE')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Format the value based on metric type
      const formattedValue = isPercentMetric(key) 
        ? formatMetricValue(value as number)
        : formatRegressionMetric(value as number);
      
      filteredMetrics.push({
        key,
        label,
        value: formattedValue
      });
    }
    
    return filteredMetrics;
  };
  
  const getLeaderboardFile = () => {
    if (!results?.files) return null;
    return results.files.find(f => 
      f.file_type.includes('leaderboard') ||
      f.file_type === 'leaderboard_csv'
    );
  };
  
  const getPredictionsFile = () => {
    if (!results?.files) return null;
    return results.files.find(f => 
      f.file_type.includes('predictions') ||
      f.file_type === 'predictions_csv'
    );
  };
  
  // Enhanced to include PDP plots
  const getVisualizationFiles = () => {
    if (!results?.files) return [];
    
    // Include all types of visualization files including PDP plots
    return results.files.filter(f => 
      f.file_type.includes('confusion_matrix') ||
      f.file_type.includes('evaluation_curve') ||
      f.file_type.includes('precision_recall') ||
      f.file_type.includes('roc_curve') ||
      f.file_type.includes('feature_importance') ||
      f.file_type.includes('shap') ||
      f.file_type.includes('learning_curve') ||
      f.file_type.includes('true_vs_predicted') ||
      f.file_type.includes('predicted_vs_residuals') ||
      f.file_type.includes('pdp_') // Add PDP plots
    );
  };
  
  // Helper to get model file
  const getModelFile = () => {
    if (results?.model_file_url) return results.model_file_url;
    if (!results?.files) return null;
    
    const modelFile = results.files.find(f => f.file_type === 'model');
    return modelFile?.file_url;
  };
  
  // Helper to get report file
  const getReportFile = () => {
    if (results?.report_file_url) return results.report_file_url;
    if (!results?.files) return null;
    
    const reportFile = results.files.find(f => 
      f.file_type.includes('report') ||
      f.file_type.includes('html')
    );
    return reportFile?.file_url;
  };
  
  // Helper to determine if we have files of a certain type
  const hasFilesOfType = (type: string): boolean => {
    return results?.files?.some(f => f.file_type.includes(type)) || false;
  };
  
  const visFiles = getVisualizationFiles();
  const leaderboardFile = getLeaderboardFile();
  const predictionsFile = getPredictionsFile();
  const modelFile = getModelFile();
  const reportFile = getReportFile();
  
  // Check if we have any PDP plots
  const hasPdpPlots = results?.files?.some(f => f.file_type.includes('pdp_')) || false;
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full md:max-w-[700px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">
            Experiment Details
          </SheetTitle>
          <SheetDescription>
            {experiment?.name || 'Loading experiment details...'}
          </SheetDescription>
        </SheetHeader>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading experiment results...</p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Experiment Info */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">
                  {results?.experiment_name || experiment?.name}
                </h3>
                
                <Badge variant={getStatusBadgeVariant(results?.status || experiment?.status || '')}>
                  {results?.status === 'completed' || results?.status === 'success' ? (
                    <span className="flex items-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Complete
                    </span>
                  ) : results?.status === 'failed' || results?.status === 'error' ? (
                    <span className="flex items-center">
                      <XCircle className="h-3 w-3 mr-1" />
                      Failed
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      {results?.status || experiment?.status || 'Processing'}
                    </span>
                  )}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono text-xs">{experiment?.id}</span>
                
                <span className="text-muted-foreground">Task Type:</span>
                <span>{formatTaskType(results?.task_type || experiment?.task_type)}</span>
                
                <span className="text-muted-foreground">Target Column:</span>
                <span>{results?.target_column || experiment?.target_column || 'N/A'}</span>
                
                <span className="text-muted-foreground">Created:</span>
                <span>
                  {experiment?.created_at 
                    ? formatDateForGreece(new Date(experiment.created_at), 'PP p') 
                    : 'N/A'}
                </span>
                
                {results?.completed_at && (
                  <>
                    <span className="text-muted-foreground">Completed:</span>
                    <span>
                      {formatDateForGreece(new Date(results.completed_at), 'PP p')}
                    </span>
                  </>
                )}
                
                {results?.training_time_sec && (
                  <>
                    <span className="text-muted-foreground">Training Time:</span>
                    <span>{formatTrainingTime(results.training_time_sec)}</span>
                  </>
                )}
                
                <span className="text-muted-foreground">AutoML Engine:</span>
                <span className="capitalize">
                  {experiment?.automl_engine || results?.automl_engine || 'N/A'}
                </span>
                
                {results?.algorithm || results?.selected_algorithm || results?.model_display_name ? (
                  <>
                    <span className="text-muted-foreground">Algorithm:</span>
                    <span>
                      {results.model_display_name || 
                       results.selected_algorithm || 
                       results.algorithm}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
            
            {/* Tabs for different sections */}
            <Tabs defaultValue="overview" value={tab} onValueChange={setTab}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="visuals">
                  Visuals {visFiles.length > 0 ? `(${visFiles.length})` : ''}
                </TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 pt-4">
                {/* Metrics Summary Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <Award className="h-4 w-4 mr-2" />
                      Performance Metrics
                    </CardTitle>
                    <CardDescription>
                      Key metrics for this experiment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {getUniqueMetrics(results?.metrics).slice(0, 6).map(metric => (
                        <div key={metric.key} className="flex flex-col">
                          <span className="text-sm text-muted-foreground">{metric.label}</span>
                          <span className="text-base font-medium">{metric.value}</span>
                        </div>
                      ))}
                      
                      {/* If no metrics are available */}
                      {(!results?.metrics || Object.keys(results.metrics).length === 0) && (
                        <p className="col-span-2 text-muted-foreground text-sm">
                          No metrics available for this experiment.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Visualizations Preview Card */}
                {visFiles.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        <BarChart2 className="h-4 w-4 mr-2" />
                        Visualizations
                      </CardTitle>
                      <CardDescription>
                        Key charts and graphs
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-2">
                      <div className="grid grid-cols-2 gap-2">
                        {visFiles.slice(0, 2).map((file, idx) => (
                          <div key={idx} className="aspect-video bg-muted rounded-md overflow-hidden">
                            <img 
                              src={file.file_url} 
                              alt={file.file_type} 
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ))}
                      </div>
                      
                      {visFiles.length > 2 && (
                        <Button 
                          variant="link" 
                          className="w-full mt-2"
                          onClick={() => setTab('visuals')}
                        >
                          View all {visFiles.length} visualizations
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {/* Downloads */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <Download className="h-4 w-4 mr-2" />
                      Downloads
                    </CardTitle>
                    <CardDescription>
                      Download experiment artifacts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        disabled={!modelFile}
                        onClick={handleDownloadTrainedModel}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Download Model
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        disabled={!reportFile}
                        onClick={handleDownloadReport}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Download Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Dataset Preview (if available) */}
                {predictionsFile && (
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => setTab('files')}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    View Predictions Data
                  </Button>
                )}
              </TabsContent>
              
              {/* Visuals Tab */}
              <TabsContent value="visuals" className="space-y-4 pt-4">
                {visFiles.length > 0 ? (
                  <div className="space-y-4">
                    {/* PDP Plots Section */}
                    {hasPdpPlots && (
                      <div>
                        <h3 className="text-base font-semibold mb-3">Partial Dependency Plots</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {results?.files?.filter(f => f.file_type.includes('pdp_')).map((file, idx) => (
                            <Card key={idx} className="overflow-hidden">
                              <CardHeader className="p-3">
                                <CardTitle className="text-sm">
                                  {formatPdpTitle(file.file_type)}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-2">
                                <img 
                                  src={file.file_url} 
                                  alt={file.file_type} 
                                  className="rounded-md w-full"
                                  onClick={() => window.open(file.file_url, '_blank')}
                                  style={{ cursor: 'pointer' }}
                                />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Other Visualizations */}
                    <h3 className="text-base font-semibold mb-3">
                      {hasPdpPlots ? 'Other Visualizations' : 'Visualizations'}
                    </h3>
                    <VisualizationDisplay results={results!} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No Visualizations Available</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-md text-center">
                      No visualization files were found for this experiment.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              {/* Files Tab */}
              <TabsContent value="files" className="space-y-4 pt-4">
                {/* Predictions File */}
                {predictionsFile ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Predictions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CSVPreview 
                        fileUrl={predictionsFile.file_url}
                        maxRows={10}
                        downloadUrl={predictionsFile.file_url}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Predictions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        No predictions file available for this experiment.
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {/* Leaderboard File */}
                {leaderboardFile && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        <TableIcon className="h-4 w-4 mr-2" />
                        Model Leaderboard
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CSVPreview 
                        fileUrl={leaderboardFile.file_url}
                        maxRows={10}
                        downloadUrl={leaderboardFile.file_url}
                      />
                    </CardContent>
                  </Card>
                )}
                
                {/* All Files List */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      All Files
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results?.files && results.files.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {results.files.map((file, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                {file.file_type}
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatDateForGreece(new Date(file.created_at), 'PP')}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  asChild
                                >
                                  <a 
                                    href={file.file_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    download={file.file_name || `${file.file_type}`}
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground">
                        No files available for this experiment.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Metrics Tab */}
              <TabsContent value="metrics" className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <BarChart2 className="h-4 w-4 mr-2" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results?.metrics && Object.keys(results.metrics).length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Metric</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getUniqueMetrics(results.metrics).map(metric => (
                            <TableRow key={metric.key}>
                              <TableCell>{metric.label}</TableCell>
                              <TableCell className="font-medium">{metric.value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground">
                        No metrics available for this experiment.
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                {/* Show configuration details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      Configuration Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Engine and task type */}
                      <div>
                        <h4 className="text-sm font-medium mb-1">Settings</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-muted-foreground">AutoML Engine:</span>
                          <span>{experiment?.automl_engine?.toUpperCase() || 'N/A'}</span>
                          
                          <span className="text-muted-foreground">Task Type:</span>
                          <span>{formatTaskType(results?.task_type || experiment?.task_type)}</span>
                          
                          <span className="text-muted-foreground">Target Column:</span>
                          <span>{results?.target_column || 'N/A'}</span>
                        </div>
                      </div>
                      
                      {/* Hyperparameters */}
                      {results?.hyperparameters && Object.keys(results.hyperparameters).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Hyperparameters</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(results.hyperparameters).map(([key, value]) => (
                              <React.Fragment key={key}>
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="truncate">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Feature selection */}
                      {results?.columns_to_keep && results.columns_to_keep.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Selected Features</h4>
                          <div className="flex flex-wrap gap-1">
                            {results.columns_to_keep.map(column => (
                              <Badge key={column} variant="secondary" className="bg-muted">
                                {column}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Footer actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={onClose}
              >
                Close
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

// Helper function to format PDP plot titles in a user-friendly way
const formatPdpTitle = (fileType: string): string => {
  if (!fileType.includes('pdp_')) return fileType;
  
  // Extract feature and class from the format "pdp_FEATURE_CLASS"
  const parts = fileType.replace('pdp_', '').split('_');
  if (parts.length >= 2) {
    const className = parts.pop(); // Last part is the class name
    const featureName = parts.join(' '); // Rest is the feature name
    return `${featureName} (${className})`;
  }
  
  return fileType.replace('pdp_', '').replace(/_/g, ' ');
};

export default ExperimentDetailDrawer;
