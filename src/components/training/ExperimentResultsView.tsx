import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Award, 
  BarChart4, 
  Clock, 
  Image as ImageIcon,
  Download, 
  FileText, 
  RefreshCw, 
  Activity,
  Loader,
  AlertTriangle
} from 'lucide-react';
import { getExperimentResults } from '@/lib/training';
import { ExperimentResults } from '@/types/training';

interface ExperimentResultsViewProps {
  experimentId: string;
  onReset?: () => void;
}

const ExperimentResultsView: React.FC<ExperimentResultsViewProps> = ({
  experimentId,
  onReset
}) => {
  const [results, setResults] = useState<ExperimentResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('metrics');
  const { toast } = useToast();

  useEffect(() => {
    if (!experimentId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function fetchResults() {
      try {
        const data = await getExperimentResults(experimentId);
        if (!cancelled) {
          if (data && data.training_results) {
            setResults(data);
          } else {
            setError('Results are still being processed. Please try again in a moment.');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load experiment results');
          toast({
            title: "Error",
            description: "Failed to load experiment results",
            variant: "destructive"
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchResults();
    return () => {
      cancelled = true;
    };
  }, [experimentId, toast]);

  // drill down into training_results for all metrics/predictions
  let training_results = null, files = [], experiment_name = '';
  if (results) {
    training_results = results.training_results ?? {};
    files = (results.files as any[]) || [];
    experiment_name = results.experiment_name || '';
  }

  const metrics = training_results ? training_results.metrics || {} : {};
  const y_true = training_results ? training_results.y_true : [];
  const y_pred = training_results ? training_results.y_pred : [];
  const y_probs = training_results ? training_results.y_probs : [];

  // Format metrics and helper functions
  const formatMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return (value * 100).toFixed(2) + '%';
  };
  
  const formatRegressionMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return value.toFixed(4);
  };
  
  const getMetricColor = (value: number | undefined) => {
    if (value === undefined) return 'text-gray-400';
    if (value >= 0.9) return 'text-green-600';
    if (value >= 0.7) return 'text-emerald-600';
    if (value >= 0.5) return 'text-amber-600';
    return 'text-red-600';
  };

  // Loading state
  if (isLoading) {
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
            <p className="text-xs font-mono text-muted-foreground">
              Experiment ID: {experimentId}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
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
            <AlertDescription>{error}</AlertDescription>
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
  
  // No results state
  if (!results) {
    return (
      <Card className="w-full mt-6 rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Award className="h-5 w-5 mr-2 text-primary" />
            No Results Available
          </CardTitle>
          <CardDescription>
            Experiment results are still being processed
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Please check back in a moment
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Extract relevant data from results
  const { 
    task_type = '',
    target_column = '',
    training_time_sec,
    completed_at,
  } = results;

  const isClassification = task_type ? task_type.includes('classification') : false;
  
  return (
    <Card className="w-full mt-6 border border-primary/20 rounded-lg shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">{experiment_name || 'Experiment Results'}</CardTitle>
          </div>
          
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {task_type.replace(/_/g, ' ')}
          </Badge>
        </div>
        
        <CardDescription className="flex flex-wrap gap-x-4 mt-2">
          <span className="inline-flex items-center">
            <Activity className="h-3.5 w-3.5 mr-1" />
            Task: <span className="font-semibold ml-1">{task_type.replace(/_/g, ' ')}</span>
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
              Time: <span className="font-semibold ml-1">{training_time_sec.toFixed(1)}s</span>
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
          <TabsList className="w-full grid grid-cols-3 rounded-none border-b h-12">
            <TabsTrigger value="metrics" className="text-sm flex items-center gap-1">
              <Activity className="h-4 w-4" />
              <span>Metrics</span>
            </TabsTrigger>
            
            <TabsTrigger value="visualizations" className="text-sm flex items-center gap-1">
              <BarChart4 className="h-4 w-4" />
              <span>Visualizations</span>
            </TabsTrigger>
            
            <TabsTrigger value="details" className="text-sm flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Details</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="p-6">
            {Object.keys(metrics).length > 0 ? (
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
            ) : (
              <div className="text-center py-10">
                <Activity className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Metrics Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto mt-2">
                  No performance metrics were found for this experiment.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="visualizations" className="p-6">
            {files.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {files.filter(file => 
                  !file.file_type.includes('model') && 
                  !file.file_type.includes('report')
                ).map((file, index) => (
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
                          <Button variant="outline" size="sm" asChild>
                            <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-1" />
                              Download
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
                  <CardTitle className="text-base">Experiment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Task Type</TableCell>
                        <TableCell>{task_type.replace(/_/g, ' ')}</TableCell>
                      </TableRow>
                      {target_column && (
                        <TableRow>
                          <TableCell className="font-medium">Target Column</TableCell>
                          <TableCell>{target_column}</TableCell>
                        </TableRow>
                      )}
                      {experimentId && (
                        <TableRow>
                          <TableCell className="font-medium">Experiment ID</TableCell>
                          <TableCell className="font-mono text-xs">{experimentId}</TableCell>
                        </TableRow>
                      )}
                      {completed_at && (
                        <TableRow>
                          <TableCell className="font-medium">Completed At</TableCell>
                          <TableCell>{new Date(completed_at).toLocaleString()}</TableCell>
                        </TableRow>
                      )}
                      {training_time_sec && (
                        <TableRow>
                          <TableCell className="font-medium">Training Time</TableCell>
                          <TableCell>{training_time_sec.toFixed(1)} seconds</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Downloads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {files.filter(file => 
                      file.file_type.includes('model') || 
                      file.file_type.includes('report')
                    ).map((file, index) => (
                      <Button key={index} variant="outline" className="w-full justify-start" asChild>
                        <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Download {file.file_type.replace(/_/g, ' ')}
                        </a>
                      </Button>
                    ))}
                    
                    {files.filter(file => 
                      file.file_type.includes('model') || 
                      file.file_type.includes('report')
                    ).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No downloadable files available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="justify-between border-t p-4">
        {onReset && (
          <Button variant="outline" onClick={onReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Run New Experiment
          </Button>
        )}
        
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

export default ExperimentResultsView;
