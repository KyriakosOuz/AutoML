import React, { useState, useEffect } from 'react';
import { getExperimentResults } from '@/lib/training';
import { ExperimentResults as ExperimentResultsType } from '@/types/training';
import { useToast } from '@/hooks/use-toast';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader,
  SheetTitle, 
  SheetDescription,
  SheetClose
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Award, 
  BarChart4, 
  Clock, 
  Download, 
  FileText, 
  Layers,
  Activity,
  Microscope,
  Loader,
  AlertTriangle,
  Download as DownloadIcon,
  Image as ImageIcon,
  X,
  Sliders,
  Table as TableIcon,
  FileText as FileTextIcon
} from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { formatDateForGreece } from '@/lib/dateUtils';
import TuneModelModal from './TuneModelModal';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { downloadFile } from '@/components/training/prediction/utils/downloadUtils';
import MetricsGrid from '@/components/training/charts/MetricsGrid';

interface ExperimentDetailDrawerProps {
  experimentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

interface VisualizationFile {
  file_url: string;
  file_type: string;
  file_name?: string;
}

interface ModelFile {
  file_url: string;
  file_type: string;
  file_name?: string;
}

const ExperimentDetailDrawer: React.FC<ExperimentDetailDrawerProps> = ({
  experimentId,
  isOpen,
  onClose,
  onRefresh
}) => {
  const [results, setResults] = useState<ExperimentResultsType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('info');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isTuneModalOpen, setIsTuneModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && experimentId) {
      setActiveTab('info');
      setError(null);
      fetchExperimentDetails();
    } else {
      setResults(null);
    }
  }, [experimentId, isOpen]);

  const fetchExperimentDetails = async () => {
    if (!experimentId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching experiment details for:", experimentId);
      const data = await getExperimentResults(experimentId);
      
      if (data) {
        console.log("Successfully fetched experiment results:", data);
        setResults(data);
      } else {
        console.log("No results returned from API");
        setError("Failed to load experiment results");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load experiment results';
      console.error("Error fetching experiment results:", errorMessage);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get visualization files from results
  const getVisualizationFiles = (): VisualizationFile[] => {
    if (!results || !results.files) return [];
    
    // Filter files to only include visualization types and exclude model/CSV files
    const visualTypes = [
      'confusion_matrix', 'evaluation_curve', 'roc_curve', 
      'precision_recall', 'feature_importance', 'learning_curve', 
      'shap', 'partial_dependence', 'ice', 'pdp', 'residuals', 'calibration'
    ];
    
    const excludeTypes = [
      'model', 'trained_model', 'leaderboard_csv', 'predictions_csv', 'csv'
    ];
    
    // Check if the results have visualizations_by_type field for better categorization
    if (results.visualizations_by_type && typeof results.visualizations_by_type === 'object') {
      // Flatten the visualization types from the backend categorization
      // But exclude model and CSV files
      return Object.entries(results.visualizations_by_type)
        .filter(([category]) => category !== 'model' && category !== 'leaderboard' && category !== 'predictions')
        .flatMap(([_, files]) => files)
        .map(file => ({
          file_url: file.file_url,
          file_type: file.file_type || 'visualization',
          file_name: file.file_name
        }));
    }
    
    // Fallback to the traditional filtering
    return (results.files || [])
      .filter(file => {
        // Check if file type matches any visualization type
        const isVisualization = visualTypes.some(type => 
          file.file_type?.toLowerCase().includes(type)
        );
        
        // Make sure it's not a model or CSV file
        const isExcluded = excludeTypes.some(type => 
          file.file_type?.toLowerCase().includes(type) || 
          file.file_name?.toLowerCase().includes(type)
        );
        
        return isVisualization && !isExcluded;
      })
      .map(file => ({
        file_url: file.file_url,
        file_type: file.file_type || 'visualization',
        file_name: file.file_name
      }));
  };
  
  // Helper function to get model file from results
  const getModelFile = (): ModelFile | null => {
    if (!results || !results.files) return null;
    
    // Look for model files
    const modelFile = (results.files || []).find(file => 
      file.file_type?.toLowerCase().includes('model') || 
      file.file_name?.toLowerCase().includes('model') ||
      file.file_name?.toLowerCase().includes('.pkl') ||
      file.file_name?.toLowerCase().includes('.h5') ||
      file.file_name?.toLowerCase().includes('.joblib') ||
      file.file_url?.toLowerCase().includes('model')
    );
    
    return modelFile ? {
      file_url: modelFile.file_url,
      file_type: modelFile.file_type || 'model',
      file_name: modelFile.file_name
    } : null;
  };
  
  // Helper function to get leaderboard file
  const getLeaderboardFile = (): ModelFile | null => {
    if (!results || !results.files) return null;
    
    const leaderboardFile = (results.files || []).find(file => 
      file.file_type?.toLowerCase().includes('leaderboard') || 
      file.file_name?.toLowerCase().includes('leaderboard')
    );
    
    return leaderboardFile ? {
      file_url: leaderboardFile.file_url,
      file_type: leaderboardFile.file_type || 'leaderboard',
      file_name: leaderboardFile.file_name
    } : null;
  };
  
  // Helper function to get readme/documentation file
  const getReadmeFile = (): ModelFile | null => {
    if (!results || !results.files) return null;
    
    const readmeFile = (results.files || []).find(file => 
      file.file_type?.toLowerCase().includes('readme') || 
      file.file_name?.toLowerCase().includes('readme') ||
      file.file_type?.toLowerCase().includes('documentation') || 
      file.file_name?.toLowerCase().includes('documentation') ||
      file.file_name?.toLowerCase().includes('.md')
    );
    
    return readmeFile ? {
      file_url: readmeFile.file_url,
      file_type: readmeFile.file_type || 'documentation',
      file_name: readmeFile.file_name
    } : null;
  };
  
  // Helper function to get predictions file
  const getPredictionsFile = (): ModelFile | null => {
    if (!results || !results.files) return null;
    
    const predictionsFile = (results.files || []).find(file => 
      file.file_type?.toLowerCase().includes('prediction') || 
      file.file_name?.toLowerCase().includes('prediction')
    );
    
    return predictionsFile ? {
      file_url: predictionsFile.file_url,
      file_type: predictionsFile.file_type || 'predictions',
      file_name: predictionsFile.file_name
    } : null;
  };
  
  // Function to handle file download
  const handleFileDownload = (url: string, filename: string) => {
    downloadFile(url, filename);
    toast({
      title: "Download Started",
      description: `Downloading ${filename}...`
    });
  };
  
  // Function to get formatted model file name
  const getModelFileName = (url: string): string => {
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    if (fileName) {
      return fileName;
    }
    
    return results?.automl_engine 
      ? `${results.automl_engine.toLowerCase()}_model.zip` 
      : 'trained_model.zip';
  };
  
  // Function to check if model can be tuned
  const canTuneModel = (): boolean => {
    // Only allow tuning for completed experiments with algorithm info
    if (!results) return false;
    if (results.status !== 'completed' && results.status !== 'success') return false;
    
    // Check if it's a custom training experiment
    return !!results.algorithm || !!results.algorithm_choice;
  };
  
  // Handler for successful model tuning
  const handleTuneSuccess = () => {
    setIsTuneModalOpen(false);
    
    // Show success message
    toast({
      title: "Tuning Job Submitted",
      description: "Your model tuning job has been submitted successfully."
    });
    
    // Refresh experiment details if callback provided
    if (onRefresh) {
      onRefresh();
    }
  };

  // Helper function to normalize metrics
  const normalizeMetrics = (metrics: any) => {
    if (!metrics) return {};
    
    // Create a new object to avoid mutating the original
    const normalizedMetrics = { ...metrics };
    
    // Handle key mismatches for common metrics
    normalizedMetrics.f1_score = metrics.f1_score ?? metrics['f1-score'];
    normalizedMetrics.precision = metrics.precision;
    normalizedMetrics.recall = metrics.recall;
    normalizedMetrics.accuracy = metrics.accuracy;
    normalizedMetrics.logloss = metrics.logloss;
    normalizedMetrics.auc = metrics.auc;
    normalizedMetrics.aucpr = metrics.aucpr;
    normalizedMetrics.mean_per_class_error = metrics.mean_per_class_error;
    
    return normalizedMetrics;
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
  
  const renderLoadingState = () => (
    <div className="space-y-4 p-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
      <Skeleton className="h-[125px] w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-[125px]" />
        <Skeleton className="h-[125px]" />
      </div>
    </div>
  );
  
  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h3 className="text-xl font-semibold text-destructive">Error Loading Results</h3>
      <p className="text-center text-muted-foreground">{error}</p>
      <Button onClick={fetchExperimentDetails}>
        Try Again
      </Button>
    </div>
  );
  
  const isExperimentRunning = results?.status === 'running';
  
  const isRegression = results?.task_type === 'regression';
  const isMulticlassClassification = results?.task_type === 'multiclass_classification';
  const isBinaryClassification = results?.task_type === 'binary_classification';
  const isH2OExperiment = results?.automl_engine?.toLowerCase() === 'h2o';
  const isMLJARExperiment = results?.automl_engine?.toLowerCase() === 'mljar';
  const hasPerClassMetrics = results?.metrics?.per_class && Object.keys(results.metrics.per_class).length > 0;
  
  // Check if experiment has per-class metrics from either source
  const hasPerClassMetricsCombined = 
    (results?.metrics?.per_class && Object.keys(results.metrics.per_class).length > 0) || 
    (results?.per_class_metrics && Object.keys(results.per_class_metrics).length > 0);
  
  // Use either metrics.per_class or per_class_metrics based on availability
  const getPerClassMetricsData = () => {
    if (results?.metrics?.per_class) return results.metrics.per_class;
    if (results?.per_class_metrics) return results.per_class_metrics;
    return null;
  };
  
  const renderPerClassMetricsTable = () => {
    const perClassData = getPerClassMetricsData();
    if (!perClassData) return null;
    
    const classLabels = Object.keys(perClassData).sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });

    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Per-Class Metrics</CardTitle>
          <CardDescription>Performance metrics for each class</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable minWidth="550px" maxHeight="400px">
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Precision</TableHead>
                <TableHead>Recall</TableHead>
                <TableHead>F1 Score</TableHead>
                <TableHead>Support</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classLabels.map(classLabel => {
                const classData = perClassData[classLabel];
                const f1Score = classData["f1-score"] !== undefined ? classData["f1-score"] : classData.f1_score;
                
                return (
                  <TableRow key={classLabel}>
                    <TableCell className="font-medium">{classLabel}</TableCell>
                    <TableCell className={getMetricColor(classData.precision)}>
                      {formatMetric(classData.precision)}
                    </TableCell>
                    <TableCell className={getMetricColor(classData.recall)}>
                      {formatMetric(classData.recall)}
                    </TableCell>
                    <TableCell className={getMetricColor(f1Score)}>
                      {formatMetric(f1Score)}
                    </TableCell>
                    <TableCell>{classData.support}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </ResponsiveTable>
        </CardContent>
      </Card>
    );
  };
  
  // Helper function to render metrics for MLJAR multiclass classification
  const renderMLJARMulticlassMetrics = () => {
    if (!isMLJARExperiment || !isMulticlassClassification || !results?.metrics) return null;
    
    const normalizedMetrics = normalizeMetrics(results.metrics);
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {normalizedMetrics.accuracy !== undefined && (
          <Card className="bg-muted/40">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getMetricColor(normalizedMetrics.accuracy)}`}>
                {formatMetric(normalizedMetrics.accuracy)}
              </div>
              <p className="text-xs text-muted-foreground">Overall prediction accuracy</p>
            </CardContent>
          </Card>
        )}
        
        {normalizedMetrics.f1_score !== undefined && (
          <Card className="bg-muted/40">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">F1 Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getMetricColor(normalizedMetrics.f1_score)}`}>
                {formatMetric(normalizedMetrics.f1_score)}
              </div>
              <p className="text-xs text-muted-foreground">Harmonic mean of precision and recall</p>
            </CardContent>
          </Card>
        )}
        
        {normalizedMetrics.precision !== undefined && (
          <Card className="bg-muted/40">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Precision</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getMetricColor(normalizedMetrics.precision)}`}>
                {formatMetric(normalizedMetrics.precision)}
              </div>
              <p className="text-xs text-muted-foreground">Positive predictive value</p>
            </CardContent>
          </Card>
        )}
        
        {normalizedMetrics.recall !== undefined && (
          <Card className="bg-muted/40">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Recall</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getMetricColor(normalizedMetrics.recall)}`}>
                {formatMetric(normalizedMetrics.recall)}
              </div>
              <p className="text-xs text-muted-foreground">Sensitivity/True Positive Rate</p>
            </CardContent>
          </Card>
        )}
        
        {normalizedMetrics.logloss !== undefined && (
          <Card className="bg-muted/40">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">LogLoss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {normalizedMetrics.logloss.toFixed(4)}
              </div>
              <p className="text-xs text-muted-foreground">Logarithmic Loss</p>
            </CardContent>
          </Card>
        )}
        
        {normalizedMetrics.auc !== undefined && (
          <Card className="bg-muted/40">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">AUC</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getMetricColor(normalizedMetrics.auc)}`}>
                {formatMetric(normalizedMetrics.auc)}
              </div>
              <p className="text-xs text-muted-foreground">Area Under ROC Curve</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };
  
  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="sm:max-w-xl md:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-xl flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Experiment Details
            </SheetTitle>
            {!isLoading && results && (
              <SheetDescription>
                {results.experiment_name || 'Unnamed Experiment'}
                {results.created_at && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    Created {formatDistanceToNow(new Date(results.created_at))} ago
                  </span>
                )}
              </SheetDescription>
            )}
          </SheetHeader>
          
          {isLoading ? (
            renderLoadingState()
          ) : error ? (
            renderErrorState()
          ) : isExperimentRunning ? (
            <div className="flex flex-col items-center justify-center p-6 space-y-4">
              <div className="animate-spin">
                <Loader className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Training in Progress</h3>
              <p className="text-center text-muted-foreground">
                This experiment is still running. Check back later for results.
              </p>
            </div>
          ) : results ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="info">
                  <div className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    <span className="hidden sm:inline">Info</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="metrics">
                  <div className="flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    <span className="hidden sm:inline">Metrics</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="visuals">
                  <div className="flex items-center gap-1">
                    <BarChart4 className="h-4 w-4" />
                    <span className="hidden sm:inline">Visuals</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="download">
                  <div className="flex items-center gap-1">
                    <DownloadIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                  </div>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>General Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-y-2">
                      <div className="text-muted-foreground">Task Type:</div>
                      <div className="font-medium">{formatTaskType(results.task_type)}</div>
                      
                      <div className="text-muted-foreground">Status:</div>
                      <div>
                        <Badge 
                          variant={results.status === 'completed' || results.status === 'success' ? 'default' : 'secondary'}
                        >
                          {results.status}
                        </Badge>
                      </div>
                      
                      {results.training_type === 'automl' || results.automl_engine ? (
                        <>
                          <div className="text-muted-foreground">Engine:</div>
                          <div className="font-medium">{results.automl_engine}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-muted-foreground">Algorithm:</div>
                          <div className="font-medium">{results.algorithm_choice || results.algorithm || 'Auto-selected'}</div>
                        </>
                      )}
                      
                      <div className="text-muted-foreground">Target Column:</div>
                      <div className="font-medium">{results.target_column}</div>
                      
                      {results.created_at && (
                        <>
                          <div className="text-muted-foreground">Created:</div>
                          <div>{new Date(results.created_at).toLocaleString()}</div>
                        </>
                      )}
                      
                      {results.completed_at && (
                        <>
                          <div className="text-muted-foreground">Completed:</div>
                          <div>{new Date(results.completed_at).toLocaleString()}</div>
                        </>
                      )}
                      
                      {results.training_time_sec && (
                        <>
                          <div className="text-muted-foreground">Training Time:</div>
                          <div>{results.training_time_sec.toFixed(2)} seconds</div>
                        </>
                      )}
                    </div>
                    
                    {canTuneModel() && (
                      <div className="mt-4">
                        <Button 
                          onClick={() => setIsTuneModalOpen(true)}
                          className="w-full"
                          variant="outline"
                        >
                          <Sliders className="h-4 w-4 mr-2" />
                          Tune This Model
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {results.hyperparameters && Object.keys(results.hyperparameters).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Hyperparameters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-y-2">
                        {Object.entries(results.hyperparameters).map(([key, value]) => (
                          <React.Fragment key={key}>
                            <div className="text-muted-foreground">{key}:</div>
                            <div>
                              {typeof value === 'object' 
                                ? JSON.stringify(value) 
                                : String(value)}
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="metrics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>
                      Key metrics from model evaluation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isRegression ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {results.metrics?.r2 !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">R² Score</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-2xl font-bold ${getMetricColor(results.metrics.r2)}`}>
                                {formatMetric(results.metrics.r2)}
                              </div>
                              <p className="text-xs text-muted-foreground">Coefficient of determination</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {results.metrics?.mae !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">MAE</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {formatMetric(results.metrics.mae)}
                              </div>
                              <p className="text-xs text-muted-foreground">Mean Absolute Error</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {results.metrics?.mse !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">MSE</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {formatMetric(results.metrics.mse)}
                              </div>
                              <p className="text-xs text-muted-foreground">Mean Squared Error</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {results.metrics?.rmse !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">RMSE</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {formatMetric(results.metrics.rmse)}
                              </div>
                              <p className="text-xs text-muted-foreground">Root Mean Squared Error</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ) : isH2OExperiment ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {results.metrics?.accuracy !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Accuracy</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-2xl font-bold ${getMetricColor(results.metrics.accuracy)}`}>
                                {formatMetric(results.metrics.accuracy)}
                              </div>
                              <p className="text-xs text-muted-foreground">Overall prediction accuracy</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {results.metrics?.auc !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">AUC</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-2xl font-bold ${getMetricColor(results.metrics.auc)}`}>
                                {formatMetric(results.metrics.auc)}
                              </div>
                              <p className="text-xs text-muted-foreground">Area Under ROC Curve</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {results.metrics?.aucpr !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">AUCPR</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-2xl font-bold ${getMetricColor(results.metrics.aucpr)}`}>
                                {formatMetric(results.metrics.aucpr)}
                              </div>
                              <p className="text-xs text-muted-foreground">Area Under Precision-Recall Curve</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {results.metrics?.logloss !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">LogLoss</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {results.metrics.logloss.toFixed(4)}
                              </div>
                              <p className="text-xs text-muted-foreground">Logarithmic Loss</p>
                            </CardContent>
                          </Card>
                        )}

                        {isMulticlassClassification && results.metrics?.mean_per_class_error !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Mean Per-Class Error</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {formatMetric(results.metrics.mean_per_class_error)}
                              </div>
                              <p className="text-xs text-muted-foreground">Average error across all classes</p>
                            </CardContent>
                          </Card>
                        )}

                        {isBinaryClassification && results.metrics?.specificity !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Specificity</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-2xl font-bold ${getMetricColor(results.metrics.specificity)}`}>
                                {formatMetric(results.metrics.specificity)}
                              </div>
                              <p className="text-xs text-muted-foreground">True Negative Rate</p>
                            </CardContent>
                          </Card>
                        )}

                        {isBinaryClassification && results.metrics?.precision !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Precision</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-2xl font-bold ${getMetricColor(results.metrics.precision)}`}>
                                {formatMetric(results.metrics.precision)}
                              </div>
                              <p className="text-xs text-muted-foreground">Positive Predictive Value</p>
                            </CardContent>
                          </Card>
                        )}

                        {isBinaryClassification && results.metrics?.recall !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Recall</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-2xl font-bold ${getMetricColor(results.metrics.recall)}`}>
                                {formatMetric(results.metrics.recall)}
                              </div>
                              <p className="text-xs text-muted-foreground">Sensitivity/True Positive Rate</p>
                            </CardContent>
                          </Card>
                        )}

                        {isBinaryClassification && results.metrics?.f1_score !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">F1 Score</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-2xl font-bold ${getMetricColor(results.metrics.f1_score)}`}>
                                {formatMetric(results.metrics.f1_score)}
                              </div>
                              <p className="text-xs text-muted-foreground">Harmonic mean of precision and recall</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {results.metrics?.mean_per_class_error && Array.isArray(results.metrics.mean_per_class_error) && 
                        results.metrics.mean_per_class_error.length > 0 && 
                        Array.isArray(results.metrics.mean_per_class_error[0]) && (
                          <Card className="bg-muted/40 col-span-2">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Per Class Error Rates</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Error Rate</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow>
                                    <TableCell>0</TableCell>
                                    <TableCell>{formatMetric(results.metrics.mean_per_class_error[0][0])}</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>1</TableCell>
                                    <TableCell>{formatMetric(results.metrics.mean_per_class_error[0][1])}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        )}
                        
                        {results.metrics?.mse !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">MSE</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {results.metrics.mse.toFixed(4)}
                              </div>
                              <p className="text-xs text-muted-foreground">Mean Squared Error</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {results.metrics?.rmse !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">RMSE</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {results.metrics.rmse.toFixed(4)}
                              </div>
                              <p className="text-xs text-muted-foreground">Root Mean Squared Error</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {results.metrics?.accuracy !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Accuracy</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-2xl font-bold ${getMetricColor(results.metrics.accuracy)}`}>
                                {formatMetric(results.metrics.accuracy)}
                              </div>
                              <p className="text-xs text-muted-foreground">Overall prediction accuracy</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Check both formats of f1 score */}
                        {(results.metrics?.f1_score !== undefined || results.metrics?.['f1-score'] !== undefined) && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">F1 Score</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-2xl font-bold ${getMetricColor(results.metrics?.f1_score ?? results.metrics?.['f1-score'])}`}>
                                {formatMetric(results.metrics?.f1_score ?? results.metrics?.['f1-score'])}
                              </div>
                              <p className="text-xs text-muted-foreground">Harmonic mean of precision and recall</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {results.metrics?.precision !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Precision</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-2xl font-bold ${getMetricColor(results.metrics.precision)}`}>
                                {formatMetric(results.metrics.precision)}
                              </div>
                              <p className="text-xs text-muted-foreground">Positive predictive value</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {results.metrics?.recall !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">Recall</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-2xl font-bold ${getMetricColor(results.metrics.recall)}`}>
                                {formatMetric(results.metrics.recall)}
                              </div>
                              <p className="text-xs text-muted-foreground">Sensitivity/True Positive Rate</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {results.metrics?.auc !== undefined && (
                          <Card className="bg-muted/40">
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">AUC</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-2xl font-bold ${getMetricColor(results.metrics.auc)}`}>
                                {formatMetric(results.metrics.auc)}
                              </div>
                              <p className="text-xs text-muted-foreground">Area Under the ROC Curve</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                    
                    {results.metrics && Object.entries(results.metrics).length > 0 && (
                      <div className="mt-4">
                        {Object.entries(normalizeMetrics(results.metrics)).map(([key, value]) => {
                          const skipKeys = [
                            'accuracy', 'f1_score', 'f1-score', 'f1', 
                            'precision', 'recall', 'auc', 'r2', 
                            'mae', 'mse', 'rmse', 'aucpr', 
                            'logloss', 'mean_per_class_error', 'per_class', 'source'
                          ];
                          
                          // Skip metrics that are already displayed above
                          if (skipKeys.includes(key) || typeof value !== 'number') return null;
                          
                          return (
                            <div key={key} className="flex justify-between border-b py-2">
                              <div className="capitalize">{key.replace(/_/g, ' ').replace(/-/g, ' ')}</div>
                              <div className="font-medium">{formatMetric(value as number)}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {hasPerClassMetricsCombined && isMulticlassClassification && renderPerClassMetricsTable()}
                    
                    {(!results.metrics || Object.keys(results.metrics).length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        No metrics available for this experiment.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="visuals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Visualizations</CardTitle>
                    <CardDescription>
                      Model performance visualizations and charts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {getVisualizationFiles().length > 0 ? (
                      <div className="space-y-6">
                        {getVisualizationFiles().length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-3">Charts & Plots</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {getVisualizationFiles().map((file, index) => (
                                <div 
                                  key={index}
                                  className="overflow-hidden rounded-md border cursor-pointer hover:border-primary/50 transition-colors"
                                  onClick={() => setSelectedImage(file.file_url)}
                                >
                                  <div className="aspect-[4/3] relative bg-muted">
                                    <img 
                                      src={file.file_url} 
                                      alt={file.file_type} 
                                      className="object-cover w-full h-full"
                                      onError={(e) => {
                                        e.currentTarget.src = 'https://placehold.co/400x300?text=Error+Loading+Image';
                                      }}
                                    />
                                  </div>
                                  <div className="p-2">
                                    <p className="text-xs font-medium capitalize">
                                      {file.file_type.replace(/_/g, ' ')}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mb-4" />
                        <p>No visualizations available for this experiment</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="download" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Model & Reports</CardTitle>
                    <CardDescription>
                      Download trained model and generated reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getModelFile() ? (
                        <Card className="bg-muted/40">
                          <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                              <div>
                                <h3 className="font-medium">Trained Model</h3>
                                <p className="text-sm text-muted-foreground">
                                  Download the trained machine learning model
                                </p>
                              </div>
                              <Button 
                                onClick={() => {
                                  const file = getModelFile();
                                  if (file) {
                                    if (isMLJARExperiment) {
                                      console.log("Downloading MLJAR model file:", file);
                                      const fileName = file.file_url.split('/').pop() || 'mljar_model.pkl';
                                      handleFileDownload(file.file_url, fileName);
                                    } else {
                                      const fileName = getModelFileName(file.file_url);
                                      handleFileDownload(file.file_url, fileName);
                                    }
                                  }
                                }}
                                className="w-full sm:w-auto"
                              >
                                <DownloadIcon className="h-4 w-4 mr-2" />
                                Download Model
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <DownloadIcon className="h-12 w-12 mx-auto mb-4" />
                          <p>No downloadable model available</p>
                        </div>
                      )}
                      
                      {getLeaderboardFile() && (
                        <Card className="bg-muted/40">
                          <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                              <div>
                                <h3 className="font-medium">Leaderboard CSV</h3>
                                <p className="text-sm text-muted-foreground">
                                  Models comparison from {results?.automl_engine || 'AutoML'} run
                                </p>
                              </div>
                              <Button 
                                onClick={() => {
                                  const file = getLeaderboardFile();
                                  if (file) {
                                    handleFileDownload(
                                      file.file_url, 
                                      `${results?.automl_engine || 'automl'}_leaderboard.csv`
                                    );
                                  }
                                }}
                                className="w-full sm:w-auto"
                                variant="outline"
                              >
                                <TableIcon className="h-4 w-4 mr-2" />
                                Download Leaderboard
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {results.report_file_url && (
                        <Card className="bg-muted/40">
                          <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                              <div>
                                <h3 className="font-medium">Experiment Report</h3>
                                <p className="text-sm text-muted-foreground">
                                  Detailed analysis and findings
                                </p>
                              </div>
                              <Button 
                                onClick={() => {
                                  if (results.report_file_url) {
                                    handleFileDownload(
                                      results.report_file_url,
                                      `${results.automl_engine || 'experiment'}_report.html`
                                    );
                                  }
                                }}
                                variant="outline" 
                                className="w-full sm:w-auto"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Download Report
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {getReadmeFile() && (
                        <Card className="bg-muted/40">
                          <CardHeader className="pb-2 pt-4">
                            <CardTitle className="text-base flex items-center">
                              <FileTextIcon className="h-5 w-5 mr-2 text-primary/70" />
                              Documentation
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground mb-3">
                              This file contains detailed documentation about the model and experiment.
                            </p>
                            <Button 
                              onClick={() => {
                                const file = getReadmeFile();
                                if (file) {
                                  handleFileDownload(
                                    file.file_url,
                                    `${results.automl_engine || 'model'}_documentation.md`
                                  );
                                }
                              }}
                              className="w-full" 
                              variant="outline"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Documentation
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                      
                      {getPredictionsFile() && (
                        <Card className="bg-muted/40">
                          <CardHeader className="pb-2 pt-4">
                            <CardTitle className="text-base flex items-center">
                              <TableIcon className="h-5 w-5 mr-2 text-primary/70" />
                              Model Predictions
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground mb-3">
                              CSV file containing model predictions on test data.
                            </p>
                            <Button 
                              onClick={() => {
                                const file = getPredictionsFile();
                                if (file) {
                                  handleFileDownload(
                                    file.file_url,
                                    `${results.automl_engine || 'model'}_predictions.csv`
                                  );
                                }
                              }}
                              className="w-full" 
                              variant="outline"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Predictions CSV
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                      
                      {(!getModelFile() && !results.report_file_url && !getReadmeFile() && !getPredictionsFile() && !getLeaderboardFile()) && (
                        <div className="text-center py-12 text-muted-foreground">
                          <DownloadIcon className="h-12 w-12 mx-auto mb-4" />
                          <p>No downloadable files available for this experiment</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 space-y-4">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">No Results Available</h3>
              <p className="text-center text-muted-foreground">
                No experiment data could be retrieved.
              </p>
            </div>
          )}
          
          <SheetClose asChild>
            <Button 
              variant="outline"
              className="mt-6"
              onClick={onClose}
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </SheetClose>
        </SheetContent>
      </Sheet>
      
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <div className="relative">
              <img 
                src={selectedImage} 
                alt="Visualization"
                className="w-full h-auto"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {results && (
        <TuneModelModal 
          experimentId={experimentId || ''}
          isOpen={isTuneModalOpen}
          onClose={() => setIsTuneModalOpen(false)}
          onSuccess={handleTuneSuccess}
          initialHyperparameters={results.hyperparameters}
          algorithm={results.algorithm || results.algorithm_choice || ''}
        />
      )}
    </>
  );
};

export default ExperimentDetailDrawer;
