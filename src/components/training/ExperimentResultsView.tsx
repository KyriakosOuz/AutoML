import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
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
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/constants';
import { 
  Activity, 
  Award, 
  BarChart3, 
  Clock, 
  Database, 
  Download,
  FileType, 
  FileInput,
  Upload
} from 'lucide-react';
import { getExperimentResults } from '@/lib/training';
import { ExperimentStatus } from '@/contexts/training/types';
import { trainingApi } from '@/lib/api';
import PredictionPanel from '@/components/prediction/PredictionPanel';

interface ExperimentResultsViewProps {
  experimentId: string;
  status: ExperimentStatus;
  onReset: () => void;
}

const ExperimentResultsView = ({ experimentId, status, onReset }: ExperimentResultsViewProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('metrics');
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getExperimentResults(experimentId);
        
        if (!data) {
          throw new Error('Failed to fetch experiment results');
        }
        
        setResults(data);
        console.log('Experiment results:', data);
      } catch (err) {
        console.error('Error fetching experiment results:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        
        toast({
          title: 'Error',
          description: 'Failed to load experiment results',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (experimentId) {
      fetchResults();
    }
  }, [experimentId, toast]);

  const formatTaskType = (type: string = '') => {
    if (!type) return "Unknown";
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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

  if (isLoading || status === 'processing' || status === 'running') {
    return (
      <Card className="w-full mt-6 rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Award className="h-5 w-5 mr-2 text-primary" />
            Training Experiment
          </CardTitle>
          <CardDescription>
            Your model is currently being trained. This may take a few minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin"></div>
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
  
  if (error || status === 'failed') {
    const errorMessage = results?.error_message || error;
    
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
            <p className="text-destructive">{errorMessage}</p>
          </div>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={onReset}
          >
            <Upload className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (!results) {
    return (
      <Card className="w-full mt-6 rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Award className="h-5 w-5 mr-2 text-primary" />
            No Results Available
          </CardTitle>
          <CardDescription>
            No experiment results found
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <Button onClick={onReset}>Start New Experiment</Button>
        </CardContent>
      </Card>
    );
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
    report_file_url
  } = results;
  
  const visualizationFiles = files.filter(file => 
    file.file_type !== 'model' && 
    !file.file_type.includes('report')
  );
  
  const isClassification = task_type?.includes('classification');
  
  return (
    <Card className="w-full border border-primary/20 rounded-lg shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">{experiment_name || 'Model Training Results'}</CardTitle>
          </div>
          
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {algorithm || formatTaskType(task_type)}
          </Badge>
        </div>
        
        <CardDescription className="flex flex-wrap gap-x-4 mt-2">
          <span className="inline-flex items-center">
            <Database className="h-3.5 w-3.5 mr-1" />
            Task: <span className="font-semibold ml-1">{formatTaskType(task_type)}</span>
          </span>
          
          <span className="inline-flex items-center">
            <Activity className="h-3.5 w-3.5 mr-1" />
            Target: <span className="font-semibold ml-1">{target_column}</span>
          </span>
          
          {training_time_sec && (
            <span className="inline-flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Time: <span className="font-semibold ml-1">{training_time_sec.toFixed(1)}s</span>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 rounded-none border-b h-12">
            <TabsTrigger value="metrics" className="text-sm">
              <Activity className="h-4 w-4 mr-2" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="visualizations" className="text-sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Visualizations
            </TabsTrigger>
            <TabsTrigger value="configuration" className="text-sm">
              <Database className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="predictions" className="text-sm">
              <Award className="h-4 w-4 mr-2" />
              Predictions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {isClassification ? (
                // Classification metrics
                <>
                  {metrics.accuracy !== undefined && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Accuracy</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.accuracy)}`}>
                          {formatMetric(metrics.accuracy)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.f1_score !== undefined && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">F1 Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.f1_score)}`}>
                          {formatMetric(metrics.f1_score)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.precision !== undefined && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Precision</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.precision)}`}>
                          {formatMetric(metrics.precision)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.recall !== undefined && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Recall</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.recall)}`}>
                          {formatMetric(metrics.recall)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                // Regression metrics
                <>
                  {metrics.r2_score !== undefined && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">R² Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.r2_score)}`}>
                          {formatRegressionMetric(metrics.r2_score)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.mae !== undefined && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Mean Absolute Error</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatRegressionMetric(metrics.mae)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.mse !== undefined && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Mean Squared Error</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatRegressionMetric(metrics.mse)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.rmse !== undefined && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Root Mean Squared Error</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatRegressionMetric(metrics.rmse)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
            
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
                        {file.file_type.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <img 
                        src={file.file_url} 
                        alt={file.file_type} 
                        className="w-full rounded-md"
                      />
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
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Visualizations Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Visualizations may not be available for this model or are still being generated.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="configuration" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Model Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Algorithm:</span>
                      <span className="font-medium">{algorithm || 'AutoML'}</span>
                      
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {Object.entries(hyperparameters).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-medium">
                            {typeof value === 'object' 
                              ? JSON.stringify(value) 
                              : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="predictions" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Use our new PredictionPanel component */}
              <PredictionPanel experimentId={experimentId} />
              
              {/* Batch prediction section */}
              <Card>
                <CardHeader>
                  <CardTitle>Batch Prediction</CardTitle>
                  <CardDescription>
                    Upload a CSV file to generate predictions for multiple samples
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-6 space-y-4">
                    <FileType className="h-12 w-12 text-muted-foreground" />
                    <p className="text-center text-sm text-muted-foreground">
                      Upload a CSV file with the same features as your training data
                    </p>
                    <Button variant="outline" className="w-full">
                      <FileInput className="h-4 w-4 mr-2" />
                      Select CSV File
                    </Button>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" disabled>
                    Generate Batch Predictions
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <Button variant="outline" onClick={onReset}>
          <Upload className="h-4 w-4 mr-2" />
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

// Helper function for regression metrics
const formatRegressionMetric = (value: number | undefined) => {
  if (value === undefined) return 'N/A';
  return value.toFixed(4);
};

export default ExperimentResultsView;
