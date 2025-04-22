
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Image as ImageIcon
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { ExperimentResults } from '@/types/training';
import { useTraining } from '@/contexts/training/TrainingContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UnifiedExperimentResultsProps {
  onReset: () => void;
}

const UnifiedExperimentResults: React.FC<UnifiedExperimentResultsProps> = ({ onReset }) => {
  const { isLoadingResults, experimentResults, activeExperimentId, error } = useTraining();
  const [activeTab, setActiveTab] = useState<string>('metrics');
  const { toast } = useToast();

  // Format task type for display
  const formatTaskType = (type: string = '') => {
    if (!type) return "Unknown";
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  // Format a metric value for display
  const formatMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return (value >= 0 && value <= 1) ? (value * 100).toFixed(2) + '%' : value.toFixed(4);
  };
  
  // Get color based on metric value
  const getMetricColor = (value: number | undefined) => {
    if (value === undefined) return 'text-gray-400';
    if (value >= 0.9) return 'text-green-600';
    if (value >= 0.7) return 'text-emerald-600';
    if (value >= 0.5) return 'text-amber-600';
    return 'text-red-600';
  };
  
  if (isLoadingResults || !experimentResults) {
    return (
      <Card className="w-full mt-6 rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Award className="h-5 w-5 mr-2 text-primary" />
            Training Experiment
          </CardTitle>
          <CardDescription>
            Loading experiment results...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin">
              <Loader className="h-12 w-12 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Processing your model training experiment...
            </p>
            {activeExperimentId && (
              <p className="text-xs font-mono text-muted-foreground">
                Experiment ID: {activeExperimentId}
              </p>
            )}
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
            <Award className="h-5 w-5 mr-2" />
            Training Error
          </CardTitle>
          <CardDescription>
            There was a problem with your experiment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={onReset}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const results = experimentResults;
  
  if (!results) {
    return null;
  }
  
  // Extract all possible data points, using optional chaining to handle missing fields
  const {
    experiment_id,
    experiment_name,
    task_type = '',
    target_column,
    metrics = {},
    files = [],
    algorithm,
    training_time_sec,
    completed_at,
    columns_to_keep = [],
    hyperparameters = {},
    model_file_url,
    report_file_url,
    training_results,
    automl_engine
  } = results;

  // If metrics is nested in training_results, use that instead
  const displayMetrics = training_results?.metrics || metrics || {};
  const classification_report = training_results?.classification_report || metrics?.classification_report;
  
  // Handle file types
  const filesByType = files.reduce((acc, file) => {
    const type = file.file_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(file);
    return acc;
  }, {} as Record<string, typeof files>);
  
  // Determine if it's a classification task
  const isClassification = task_type?.includes('classification');
  
  // Get all downloadable files
  const downloadableFiles = [
    ...(model_file_url ? [{ name: 'Model File', url: model_file_url, icon: <DownloadCloud className="h-4 w-4 mr-2" /> }] : []),
    ...(report_file_url ? [{ name: 'Report', url: report_file_url, icon: <FileText className="h-4 w-4 mr-2" /> }] : []),
    ...(files.filter(file => file.file_type === 'model').map(file => ({ 
      name: 'Model File', 
      url: file.file_url, 
      icon: <DownloadCloud className="h-4 w-4 mr-2" /> 
    })))
  ];
  
  return (
    <Card className="w-full mt-6 border border-primary/20 rounded-lg shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">{experiment_name || 'Model Training Results'}</CardTitle>
          </div>
          
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {algorithm || automl_engine || task_type?.replace(/_/g, ' ') || 'AutoML'}
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
          
          {/* Metrics Tab - Dynamically show metrics based on type */}
          <TabsContent value="metrics" className="p-6">
            {Object.keys(displayMetrics).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(displayMetrics)
                  .filter(([key]) => key !== 'classification_report') // Filter out the report
                  .map(([key, value]) => {
                    // Skip non-numeric metrics or complex objects
                    if (typeof value !== 'number') return null;
                    
                    // Determine if this is a percentage-based metric
                    const isPercentageMetric = ['accuracy', 'f1_score', 'precision', 'recall', 'auc'].includes(key);
                    
                    return (
                      <Card key={key} className="shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base capitalize">
                            {key.replace(/_/g, ' ')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-2xl font-bold ${isPercentageMetric ? getMetricColor(value) : ''}`}>
                            {isPercentageMetric ? formatMetric(value) : value.toFixed(4)}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
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
            
            {/* Classification Report (if available) */}
            {classification_report && (
              <div className="mt-6">
                <h3 className="text-base font-semibold mb-2">Classification Report</h3>
                <div className="bg-muted/40 p-4 rounded-md overflow-x-auto">
                  <pre className="whitespace-pre-wrap text-xs font-mono">
                    {typeof classification_report === 'string' 
                      ? classification_report 
                      : JSON.stringify(classification_report, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Visualizations Tab - Display all visualization files */}
          <TabsContent value="visualizations" className="p-6">
            {files.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {files
                  .filter(file => file.file_type !== 'model') // Exclude model files
                  .map((file, index) => (
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
                  No visualizations were found for this experiment.
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* Details Tab - Show experiment metadata */}
          <TabsContent value="details" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Experiment Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      {algorithm && (
                        <TableRow>
                          <TableCell className="font-medium">Algorithm</TableCell>
                          <TableCell>{algorithm}</TableCell>
                        </TableRow>
                      )}
                      {automl_engine && (
                        <TableRow>
                          <TableCell className="font-medium">AutoML Engine</TableCell>
                          <TableCell>{automl_engine}</TableCell>
                        </TableRow>
                      )}
                      {task_type && (
                        <TableRow>
                          <TableCell className="font-medium">Task Type</TableCell>
                          <TableCell>{formatTaskType(task_type)}</TableCell>
                        </TableRow>
                      )}
                      {target_column && (
                        <TableRow>
                          <TableCell className="font-medium">Target Column</TableCell>
                          <TableCell>{target_column}</TableCell>
                        </TableRow>
                      )}
                      {experiment_id && (
                        <TableRow>
                          <TableCell className="font-medium">Experiment ID</TableCell>
                          <TableCell className="font-mono text-xs">{experiment_id}</TableCell>
                        </TableRow>
                      )}
                      {completed_at && (
                        <TableRow>
                          <TableCell className="font-medium">Completed At</TableCell>
                          <TableCell>{new Date(completed_at).toLocaleString()}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              {columns_to_keep && columns_to_keep.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Feature Selection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {columns_to_keep.map((column, index) => (
                        <Badge key={index} variant="secondary" className="bg-primary/5">
                          {column}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {hyperparameters && Object.keys(hyperparameters).length > 0 && (
                <Card className="shadow-sm md:col-span-2">
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
                        {Object.entries(hyperparameters).map(([key, value]) => (
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
            </div>
          </TabsContent>
          
          {/* Downloads Tab - Provide downloadable artifacts */}
          <TabsContent value="downloads" className="p-6">
            {downloadableFiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {downloadableFiles.map((file, index) => (
                  <Card key={index} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{file.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full">
                        <a href={file.url} download target="_blank" rel="noopener noreferrer">
                          {file.icon} Download {file.name}
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DownloadCloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Downloads Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  No downloadable artifacts were found for this experiment.
                </p>
              </div>
            )}
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

export default UnifiedExperimentResults;
