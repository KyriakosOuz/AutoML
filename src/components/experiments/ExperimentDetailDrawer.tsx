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
import TuneModelModal from './TuneModelModal';

interface ExperimentDetailDrawerProps {
  experimentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
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
  
  const getVisualizationFiles = () => {
    if (!results?.files) return [];
    
    return results.files.filter(file => 
      !file.file_type.includes('model') && 
      !file.file_type.includes('report') &&
      !file.file_type.includes('label_encoder') &&
      !file.file_type.includes('readme') &&
      !file.file_type.includes('predictions')
    );
  };
  
  const getModelFile = () => {
    if (!results?.files) return null;
    
    return results.files.find(file => 
      file.file_type === 'model' || 
      file.file_type.includes('model')
    );
  };

  const getReadmeFile = () => {
    if (!results?.files) return null;
    
    return results.files.find(file => 
      file.file_type === 'readme' || 
      file.file_type.includes('README.md')
    );
  };
  
  const getPredictionsFile = () => {
    if (!results?.files) return null;
    
    return results.files.find(file => 
      file.file_type === 'predictions_csv' ||
      file.file_type.includes('predictions')
    );
  };

  const canTuneModel = () => {
    console.log("canTuneModel check:", {
      hasAutoML: !!results?.automl_engine,
      algorithm: results?.algorithm,
      algorithm_choice: results?.algorithm_choice,
      training_type: results?.training_type,
      status: results?.status
    });
    
    return results && 
           ((results.training_type === 'custom') || (!results.automl_engine)) && 
           (results.algorithm || results.algorithm_choice) && 
           (results.status === 'completed' || results.status === 'success');
  };
  
  const handleTuneSuccess = () => {
    if (onRefresh) {
      onRefresh();
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
                        
                        {results.metrics?.f1_score !== undefined && (
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
                        {Object.entries(results.metrics).map(([key, value]) => {
                          const skipKeys = ['accuracy', 'f1_score', 'precision', 'recall', 'auc', 'r2', 'mae', 'mse', 'rmse'];
                          if (skipKeys.includes(key) || typeof value !== 'number') return null;
                          
                          return (
                            <div key={key} className="flex justify-between border-b py-2">
                              <div className="capitalize">{key.replace(/_/g, ' ')}</div>
                              <div className="font-medium">{formatMetric(value as number)}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
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
                              <Button asChild className="w-full sm:w-auto">
                                <a 
                                  href={getModelFile()?.file_url} 
                                  download 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <DownloadIcon className="h-4 w-4 mr-2" />
                                  Download Model
                                </a>
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
                              <Button asChild variant="outline" className="w-full sm:w-auto">
                                <a 
                                  href={results.report_file_url} 
                                  download 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Download Report
                                </a>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Documentation Section for README */}
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
                            <Button asChild className="w-full" variant="outline">
                              <a 
                                href={getReadmeFile()?.file_url} 
                                download 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Documentation
                              </a>
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Predictions Section for CSV */}
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
                            <Button asChild className="w-full" variant="outline">
                              <a 
                                href={getPredictionsFile()?.file_url} 
                                download 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Predictions CSV
                              </a>
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                      
                      {(!getModelFile() && !results.report_file_url && !getReadmeFile() && !getPredictionsFile()) && (
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
