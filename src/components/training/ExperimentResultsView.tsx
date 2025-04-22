
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Award, 
  BarChart4, 
  Clock, 
  Download, 
  FileText, 
  RefreshCw, 
  Layers,
  Settings,
  Activity,
  Loader,
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react';
import { getExperimentResults } from '@/lib/training';
import { ExperimentStatus } from '@/contexts/training/types';

import ClassificationReportTable from './ClassificationReportTable';

interface ExperimentMetadata {
  experiment_id: string;
  experiment_name: string;
  status: 'completed' | 'running' | 'failed';
  task_type: string;
  algorithm: string;
  automl_engine: string;
  target_column: string;
  hyperparameters: Record<string, any>;
  training_time_sec: number;
  created_at: string;
  completed_at: string;
  error_message: string | null;
}

interface ExperimentFile {
  file_type: string;
  file_url: string;
  file_name: string;
}

interface ExperimentResultsProps {
  experimentId: string | null;
  onReset?: () => void;
}

const ExperimentResultsView: React.FC<ExperimentResultsProps> = ({
  experimentId,
  onReset
}) => {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('metrics');
  const { toast } = useToast();

  // Fetch and normalize the experiment response
  useEffect(() => {
    if (!experimentId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function fetchResults() {
      try {
        const response = await getExperimentResults(experimentId);
        if (!cancelled) {
          if (!response) {
            setError('Results are still being processed. Please try again in a moment.');
            setIsLoading(false);
            return;
          }
          
          // Unwrap the payload from the API response
          const payload = response;
          
          // Compute training time if needed
          let trainingTimeSec = payload.training_time_sec;
          if (!trainingTimeSec && payload.created_at && payload.completed_at) {
            const created = new Date(payload.created_at);
            const completed = new Date(payload.completed_at);
            trainingTimeSec = (completed.getTime() - created.getTime()) / 1000;
          }

          setResults({
            experiment_metadata: {
              experiment_id: payload.experimentId ?? payload.experiment_id,
              experiment_name: payload.experiment_name,
              status: payload.status,
              task_type: payload.task_type,
              algorithm: payload.algorithm,
              automl_engine: payload.automl_engine,
              target_column: payload.target_column,
              hyperparameters: payload.hyperparameters,
              training_time_sec: trainingTimeSec,
              created_at: payload.created_at,
              completed_at: payload.completed_at,
              error_message: payload.error || payload.error_message,
            },
            metrics: payload.training_results?.metrics || {},
            files: payload.files || [],
          });
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load experiment results';
          setError(errorMessage);
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
          </div>
        </CardContent>
      </Card>
    );
  }

  // ↓ Destructure from results object 
  const { experiment_metadata, metrics, files } = results;

  // Only pass number metrics to grid
  const numberMetrics = Object.fromEntries(
    Object.entries(metrics).filter(([k, v]) => typeof v === "number")
  );
  
  const classificationReport = metrics.classification_report ?? null;

  const formatTaskType = (type: string = '') => {
    if (!type) return "Unknown";
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  const isVisualizationFile = (fileType: string) => {
    const visualTypes = ['distribution', 'shap', 'confusion_matrix', 'importance', 'plot', 'chart', 'graph', 'visualization'];
    return visualTypes.some(type => fileType.includes(type));
  };
  
  const getDownloadableFiles = () => {
    return files.filter(file => 
      file.file_type === 'model' || 
      file.file_type === 'report' || 
      file.file_type.includes('report')
    );
  };

  return (
    <Card className="w-full mt-6 border border-primary/20 rounded-lg shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">{experiment_metadata.experiment_name || 'Experiment Results'}</CardTitle>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {experiment_metadata.algorithm || experiment_metadata.automl_engine || experiment_metadata.task_type}
          </Badge>
        </div>
        <CardDescription className="flex flex-wrap gap-x-4 mt-2">
          <span className="inline-flex items-center">
            <Activity className="h-3.5 w-3.5 mr-1" />
            Task: <span className="font-semibold ml-1">{experiment_metadata.task_type}</span>
          </span>
          {experiment_metadata.target_column && (
            <span className="inline-flex items-center">
              <Activity className="h-3.5 w-3.5 mr-1" />
              Target: <span className="font-semibold ml-1">{experiment_metadata.target_column}</span>
            </span>
          )}
          {experiment_metadata.training_time_sec && (
            <span className="inline-flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Time: <span className="font-semibold ml-1">{experiment_metadata.training_time_sec.toFixed(1)}s</span>
            </span>
          )}
          {experiment_metadata.experiment_id && (
            <span className="inline-flex items-center">
              <span className="font-mono text-xs text-muted-foreground">ID: {String(experiment_metadata.experiment_id).substring(0, 8)}</span>
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
              <FileText className="h-4 w-4" />
              <span>Details</span>
            </TabsTrigger>
            <TabsTrigger value="downloads" className="text-sm flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>Downloads</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="p-6">
            {Object.keys(numberMetrics).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(numberMetrics).map(([key, value]) => (
                  <Card key={key} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm capitalize">{key.replace(/_/g, " ")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {key.toLowerCase().includes("accuracy") ||
                        key.toLowerCase().includes("f1_score") ||
                        key.toLowerCase().includes("precision") ||
                        key.toLowerCase().includes("recall")
                          ? `${(value as number * 100).toFixed(2)}%`
                          : (value as number).toFixed(4)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={file.file_url} download={file.file_name} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4 mr-1" />
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
                        <TableCell>{experiment_metadata.task_type}</TableCell>
                      </TableRow>
                      {experiment_metadata.target_column && (
                        <TableRow>
                          <TableCell className="font-medium">Target Column</TableCell>
                          <TableCell>{experiment_metadata.target_column}</TableCell>
                        </TableRow>
                      )}
                      {experiment_metadata.experiment_id && (
                        <TableRow>
                          <TableCell className="font-medium">Experiment ID</TableCell>
                          <TableCell className="font-mono text-xs">{experiment_metadata.experiment_id}</TableCell>
                        </TableRow>
                      )}
                      {experiment_metadata.completed_at && (
                        <TableRow>
                          <TableCell className="font-medium">Completed At</TableCell>
                          <TableCell>{new Date(experiment_metadata.completed_at).toLocaleString()}</TableCell>
                        </TableRow>
                      )}
                      {experiment_metadata.training_time_sec && (
                        <TableRow>
                          <TableCell className="font-medium">Training Time</TableCell>
                          <TableCell>{experiment_metadata.training_time_sec.toFixed(1)} seconds</TableCell>
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
                    {getDownloadableFiles().map((file, index) => (
                      <Button key={index} variant="outline" className="w-full justify-start" asChild>
                        <a href={file.file_url} download={file.file_name} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" /> 
                          Download {file.file_name}
                        </a>
                      </Button>
                    ))}
                    
                    {getDownloadableFiles().length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No downloadable files available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="downloads" className="p-6">
            {getDownloadableFiles().length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getDownloadableFiles().map((file, index) => (
                  <Card key={index} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base capitalize">{file.file_type.replace(/_/g, ' ')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full">
                        <a href={file.file_url} download={file.file_name} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" /> 
                          Download {file.file_name}
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Downloads Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  No downloadable artifacts were found for this experiment.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ExperimentResultsView;
