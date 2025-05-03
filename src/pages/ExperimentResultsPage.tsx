import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trainingApi } from '@/lib/api';
import { ExperimentResults } from '@/types/training';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import {
  Award,
  AlertTriangle,
  Copy,
  DownloadCloud,
  Loader,
  RefreshCw,
  Check,
  Link,
  HelpCircle,
  Info
} from 'lucide-react';

const POLL_INTERVAL = 2000; // 2 seconds
const MAX_RETRY_ATTEMPTS = 3;

// Helper component for metric explanations
const MetricTooltip = ({ metricName, children }) => {
  const explanations = {
    accuracy: "Percentage of correct predictions across all samples",
    precision: "Percentage of correctly identified positive cases among all predicted positives",
    recall: "Percentage of correctly identified positive cases among all actual positives",
    f1_score: "Harmonic mean of precision and recall, balancing both metrics",
    roc_auc: "Area under the ROC Curve - measures model's ability to distinguish between classes",
    mse: "Mean Squared Error - average squared difference between predicted and actual values",
    rmse: "Root Mean Squared Error - square root of MSE, shows error in original units",
    mae: "Mean Absolute Error - average absolute difference between predicted and actual values",
    r2: "R-Squared - proportion of variance explained by the model (1.0 is perfect)"
  };
  
  const explanation = explanations[metricName.toLowerCase().replace(' ', '_')] || 
    "Measures model performance";
    
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-help">
            {children}
            <HelpCircle className="h-4 w-4 text-gray-400" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-2">
          <p>{explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const ExperimentResultsPage: React.FC = () => {
  const { experimentId } = useParams<{ experimentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [results, setResults] = useState<ExperimentResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeTab, setActiveTab] = useState('metrics');
  const [copied, setCopied] = useState(false);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);

  // Function to poll for experiment results
  const fetchResults = async () => {
    if (!experimentId) return;
    
    try {
      setLoading(true);
      const data = await trainingApi.getExperimentResults(experimentId);
      setResults(data);
      setError(null);
      
      if (data.status === 'failed') {
        // Stop polling if experiment failed
        toast({
          title: "Training Failed",
          description: `⚠️ Experiment failed: ${data.error_message || 'Unknown error'}`,
          variant: "destructive"
        });
        setLoading(false);
      } else if (data.status === 'completed' || data.status === 'success') {
        // Stop polling if experiment completed
        toast({
          title: "Training Completed",
          description: "Model training completed successfully!"
        });
        setLoading(false);
      }
      // Reset retry count on successful fetch
      setRetryCount(0);
    } catch (error) {
      console.error('Error fetching experiment results:', error);
      
      // Increment retry count
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      if (newRetryCount >= MAX_RETRY_ATTEMPTS) {
        setError('Failed to fetch experiment results after multiple attempts. Please try again later.');
        setLoading(false);
        toast({
          title: "Network Error",
          description: "Failed to connect to the server. Please check your connection.",
          variant: "destructive"
        });
      }
    }
  };

  // Copy experiment ID to clipboard
  const copyExperimentId = () => {
    if (experimentId) {
      navigator.clipboard.writeText(experimentId);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Experiment ID copied to clipboard"
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Copy shareable link to clipboard
  const copyShareableLink = () => {
    const url = `${window.location.origin}/results/${experimentId}`;
    navigator.clipboard.writeText(url);
    setShareUrlCopied(true);
    toast({
      title: "Copied!",
      description: "Shareable link copied to clipboard"
    });
    setTimeout(() => setShareUrlCopied(false), 2000);
  };

  // Retry fetching results
  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    setLoading(true);
    fetchResults();
  };

  // Set up polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    // Initial fetch
    fetchResults();
    
    // Set up polling if loading and no error
    if (loading && !error) {
      pollInterval = setInterval(() => {
        fetchResults();
      }, POLL_INTERVAL);
    }
    
    // Clean up interval on unmount
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [experimentId, loading, error, retryCount]);

  if (!experimentId) {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>No experiment ID provided</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate('/training')}>
          Return to Training
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={handleRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (loading && (!results || results.status === 'running' || results.status === 'processing')) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Loader className="h-5 w-5 mr-2 animate-spin" />
              Training in Progress
            </CardTitle>
            <CardDescription>
              {results?.status === 'processing' 
                ? "Waiting for experiment to start..." 
                : "Your model is currently being trained. This may take a few minutes."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin"></div>
              </div>
              <p className="mt-6 text-center max-w-md text-muted-foreground">
                {results?.status === 'processing' 
                  ? "Waiting for experiment to start..." 
                  : "Training in progress. This might take a few minutes depending on the dataset size."}
              </p>
              <div className="mt-6 flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Experiment ID:</p>
                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{experimentId}</code>
                <Button variant="outline" size="sm" onClick={copyExperimentId}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={copyShareableLink}>
                  {shareUrlCopied ? <Check className="h-4 w-4 mr-2" /> : <Link className="h-4 w-4 mr-2" />}
                  Copy Shareable Link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (results?.status === 'failed') {
    return (
      <div className="container py-10">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Training Failed
            </CardTitle>
            <CardDescription>
              There was an error while training your model
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {results.error_message || "An unknown error occurred during training"}
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Experiment ID:</p>
              <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{experimentId}</code>
              <Button variant="outline" size="sm" onClick={copyExperimentId}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="mr-2" onClick={() => navigate('/training')}>
              Return to Training
            </Button>
            <Button variant="outline" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (results?.status === 'completed' || results?.status === 'success') {
    const { training_results, files = [] } = results;
    const metrics = training_results?.metrics || {};
    const modelFile = files.find(file => file.file_type === 'model');
    const visualizationFiles = files.filter(file => file.file_type !== 'model');

    // Info panel with experiment details
    const ExperimentInfoPanel = () => (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Experiment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Task Type:</p>
              <p className="font-medium capitalize">{(results.task_type || "").replace("_", " ")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Target Column:</p>
              <p className="font-medium">{results.target_column || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Algorithm:</p>
              <p className="font-medium">{results.algorithm || "AutoML"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Experiment ID:</p>
              <div className="flex items-center gap-1">
                <p className="font-mono text-xs truncate">{experimentId.substring(0, 8)}...</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyExperimentId}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );

    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-primary" />
                  {results.experiment_name || 'Training Results'}
                </CardTitle>
                <CardDescription className="mt-1">
                  Experiment completed successfully
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-primary">
                {results.algorithm || 'AutoML'}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary">ID: {experimentId.substring(0, 8)}</Badge>
              {results.task_type && (
                <Badge variant="secondary">
                  Task: {results.task_type.replace('_', ' ')}
                </Badge>
              )}
              {results.target_column && (
                <Badge variant="secondary">
                  Target: {results.target_column}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
                <TabsTrigger value="download">Download</TabsTrigger>
              </TabsList>
              
              <TabsContent value="metrics" className="space-y-4">
                <div className="md:flex gap-4 mt-4">
                  <div className="md:w-1/4">
                    <ExperimentInfoPanel />
                  </div>
                  
                  <div className="md:w-3/4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(metrics).map(([key, value]) => (
                        <Card key={key}>
                          <CardHeader className="py-4">
                            <MetricTooltip metricName={key}>
                              <CardTitle className="text-sm capitalize">{key.replace('_', ' ')}</CardTitle>
                            </MetricTooltip>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {typeof value === 'number' ? 
                                value >= 0 && value <= 1 ? 
                                  `${(value * 100).toFixed(2)}%` : 
                                  value.toFixed(4) 
                                : value}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Predictions vs Actual (if available) */}
                    {training_results?.y_true && training_results?.y_pred && (
                      <Card className="mt-6">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>Predictions vs Actual</CardTitle>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-help">
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Sample of test data showing model predictions compared to actual values</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr>
                                  <th className="border border-border px-4 py-2">#</th>
                                  <th className="border border-border px-4 py-2">Actual</th>
                                  <th className="border border-border px-4 py-2">Predicted</th>
                                  {training_results.y_probs && (
                                    <th className="border border-border px-4 py-2">Confidence</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {Array.isArray(training_results.y_true) && 
                                Array.isArray(training_results.y_pred) && 
                                training_results.y_true.slice(0, 10).map((actual, index) => (
                                  <tr key={index}>
                                    <td className="border border-border px-4 py-2">{index + 1}</td>
                                    <td className="border border-border px-4 py-2">{actual}</td>
                                    <td className="border border-border px-4 py-2">
                                      {training_results.y_pred[index]}
                                    </td>
                                    {training_results.y_probs && (
                                      <td className="border border-border px-4 py-2">
                                        {Array.isArray(training_results.y_probs[index]) ? 
                                          `${(Math.max(...training_results.y_probs[index]) * 100).toFixed(2)}%` : 
                                          'N/A'}
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {Array.isArray(training_results.y_true) && training_results.y_true.length > 10 && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Showing 10 of {training_results.y_true.length} predictions
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="visualizations">
                {visualizationFiles.length > 0 ? (
                  <>
                    <div className="mb-4 mt-4">
                      <h3 className="text-lg font-medium mb-1">Model Performance Visualizations</h3>
                      <p className="text-sm text-muted-foreground">
                        Click on any visualization to view it in detail and download the image
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {visualizationFiles.map((file, idx) => (
                        <Dialog key={idx}>
                          <DialogTrigger asChild>
                            <Card className="cursor-pointer hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
                                  <img 
                                    src={file.file_url} 
                                    alt={file.file_type} 
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                                <div className="mt-2">
                                  <p className="font-medium text-sm capitalize">
                                    {file.file_type.replace('_', ' ')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(file.created_at).toLocaleString()}
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
                              <div className="mt-4 flex justify-between items-center">
                                <div>
                                  <h3 className="font-medium capitalize text-lg">
                                    {file.file_type.replace('_', ' ')}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {getVisualizationDescription(file.file_type)}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(file.created_at).toLocaleString()}
                                  </p>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                                    <DownloadCloud className="h-4 w-4 mr-2" />
                                    Download
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-muted-foreground">No visualizations available</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="download">
                <div className="py-6">
                  {modelFile ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Download Trained Model</CardTitle>
                        <CardDescription>
                          Download the trained model file to use in your applications
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center">
                          <Button asChild>
                            <a href={modelFile.file_url} download target="_blank" rel="noopener noreferrer">
                              <DownloadCloud className="h-4 w-4 mr-2" />
                              Download Model
                            </a>
                          </Button>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Created: {new Date(modelFile.created_at).toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <p className="text-muted-foreground">No model file available for download</p>
                    </div>
                  )}
                  
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Share Experiment</h3>
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm">Experiment ID:</p>
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{experimentId}</code>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" onClick={copyExperimentId}>
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy Experiment ID</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={copyShareableLink}>
                          {shareUrlCopied ? <Check className="h-4 w-4 mr-2" /> : <Link className="h-4 w-4 mr-2" />}
                          Copy Shareable Link
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={() => navigate('/training')}>
              Back to Training
            </Button>
            
            {results.completed_at && (
              <p className="text-xs text-muted-foreground">
                Completed: {new Date(results.completed_at).toLocaleString()}
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <Toaster />
      <Card>
        <CardHeader>
          <CardTitle>Loading Experiment</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader className="animate-spin h-8 w-8 text-primary" />
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to get a description for each visualization type
function getVisualizationDescription(fileType: string): string {
  const descriptions = {
    'confusion_matrix': 'Shows predicted vs. actual class counts, helping identify common misclassifications',
    'roc_curve': 'Receiver Operating Characteristic curve showing model's true positive vs. false positive rate',
    'precision_recall': 'Shows the trade-off between precision and recall at different thresholds',
    'feature_importance': 'Ranks features by their importance in the model\'s predictions',
    'learning_curve': 'Shows training and validation performance as training set size increases',
    'calibration_curve': 'Shows how well the model\'s predicted probabilities match actual outcomes',
    'prediction_error': 'Plots actual vs. predicted values to show prediction errors',
    'residuals': 'Shows errors between predicted and actual values',
  };
  
  return descriptions[fileType.toLowerCase()] || 'Visualization of model performance metrics';
}

export default ExperimentResultsPage;
