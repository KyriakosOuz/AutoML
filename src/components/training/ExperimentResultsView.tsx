import React, { useState, useEffect } from 'react';
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
  Download, 
  FileText, 
  RefreshCw, 
  Layers,
  Settings,
  Activity,
  Loader,
  Image as ImageIcon,
  AlertTriangle,
  BrainCircuit,
  FileInput,
  Upload
} from 'lucide-react';
import { getExperimentResults } from '@/lib/training';
import { ExperimentStatus } from '@/contexts/training/types';
import { trainingApi } from '@/lib/api';

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

interface ExperimentMetadata {
  experiment_id: string;
  experiment_name: string;
  status: 'completed' | 'running' | 'failed' | string;
  task_type: string;
  algorithm: string;
  automl_engine: string;
  target_column: string;
  hyperparameters: Record<string, any>;
  training_time_sec: number;
  created_at: string;
  completed_at: string;
  error_message: string | null;
  training_type?: 'automl' | 'custom'; // Add training_type property
  algorithm_choice?: string; // Add algorithm_choice property
}

interface ExperimentFile {
  file_type: string;
  file_url: string;
  file_name: string;
  created_at?: string;
}

interface ClassificationReport {
  [label: string]: {
    precision: number;
    recall: number;
    "f1-score": number;
    support: number;
  };
}

interface ExtendedMetrics extends Record<string, any> {
  classification_report?: ClassificationReport | string | null;
  confusion_matrix?: number[][] | null;
  fpr?: number[];
  tpr?: number[];
  auc?: number;
  precision?: number[];
  recall?: number[];
  f1_score?: number;
  shap_values?: any;
}

interface ExperimentResultsData {
  experiment_metadata: ExperimentMetadata;
  metrics: Record<string, number>;
  classificationReport?: ClassificationReport | string | null;
  confusionMatrix?: number[][] | null;
  roc?: { fpr: number[]; tpr: number[]; auc: number } | null;
  prCurve?: { precision: number[]; recall: number[]; f1Score: number } | null;
  shapValues?: any;
  files: ExperimentFile[];
}

interface ManualPredictionResponse {
  prediction: string | number;
  probability?: number | number[];
  error?: string;
}

interface BatchPredictionResponse {
  metrics?: Record<string, number>;
  preview?: Record<string, any>[];
  error?: string;
}

interface ExperimentResultsProps {
  experimentId: string | null;
  onReset?: () => void;
}

const ExperimentResultsView: React.FC<ExperimentResultsProps> = ({
  experimentId,
  onReset
}) => {
  const [results, setResults] = useState<ExperimentResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('metrics');
  const { toast } = useToast();
  
  const [predictInputs, setPredictInputs] = useState<Record<string, string>>({});
  const [predictResult, setPredictResult] = useState<ManualPredictionResponse | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batchResult, setBatchResult] = useState<BatchPredictionResponse | null>(null);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  useEffect(() => {
    if (!experimentId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function fetchResults() {
      try {
        const apiRes = await getExperimentResults(experimentId);
        
        console.log('[ExperimentResultsView] Raw API response:', apiRes);

        if (apiRes === null) {
          if (!cancelled) {
            setResults(null);
            setIsLoading(false);
          }
          return;
        }

        if (typeof apiRes === 'object') {
          console.log('[ExperimentResultsView] API keys:', Object.keys(apiRes));
          if ('training_results' in apiRes) {
            console.log('[ExperimentResultsView] training_results keys:', Object.keys(apiRes.training_results ?? {}));
          }
        }

        if (!apiRes) {
          if (!cancelled) {
            setResults(null);
            setIsLoading(false);
          }
          return;
        }

        const payload = apiRes;
        const tr = payload.training_results || {};
        const allMetrics = (tr && typeof tr === 'object' && 'metrics' in tr) ? tr.metrics || {} : {};
        
        const typedMetrics = allMetrics as ExtendedMetrics;

        const numericMetrics: Record<string, number> = {};
        Object.entries(allMetrics).forEach(([key, value]) => {
          if (typeof value === 'number') {
            numericMetrics[key] = value;
          }
        });

        const classificationReport = typedMetrics.classification_report ?? null;
        const confusionMatrix = typedMetrics.confusion_matrix ?? null;
        
        const roc = (typedMetrics.fpr && typedMetrics.tpr && typedMetrics.auc)
          ? { fpr: typedMetrics.fpr, tpr: typedMetrics.tpr, auc: typedMetrics.auc }
          : null;
          
        const prCurve = (Array.isArray(typedMetrics.precision) && Array.isArray(typedMetrics.recall) && typeof typedMetrics.f1_score === 'number')
          ? { precision: typedMetrics.precision, recall: typedMetrics.recall, f1Score: typedMetrics.f1_score }
          : null;
          
        const shapValues = typedMetrics.shap_values ?? undefined;

        let trainingTimeSec = payload.training_time_sec;
        if (!trainingTimeSec && payload.created_at && payload.completed_at) {
          const created = new Date(payload.created_at);
          const completed = new Date(payload.completed_at);
          trainingTimeSec = (completed.getTime() - created.getTime()) / 1000;
        }

        const processedFiles: ExperimentFile[] = (payload.files || []).map(file => ({
          ...file,
          file_name: file.file_name || file.file_type + '.file'
        }));

        if (!cancelled) {
          setResults({
            experiment_metadata: {
              experiment_id: payload.experiment_id,
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
              error_message: payload.error_message ?? null,
              training_type: payload.training_type,
              algorithm_choice: payload.algorithm_choice,
            },
            metrics: numericMetrics,
            classificationReport,
            confusionMatrix,
            roc,
            prCurve,
            shapValues,
            files: processedFiles,
          });
          
          if (payload.columns_to_keep && Array.isArray(payload.columns_to_keep)) {
            const initialInputs: Record<string, string> = {};
            payload.columns_to_keep.forEach((column: string) => {
              if (column !== payload.target_column) {
                initialInputs[column] = '';
              }
            });
            setPredictInputs(initialInputs);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load experiment results';
          setError(errorMessage);
          toast({
            title: "Error",
            description: errorMessage,
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
  
  const handleManualPredictSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    setPredictError(null);
    setPredictResult(null);
    
    try {
      if (!experimentId) throw new Error('Experiment ID is required');
      
      const formattedInputs: Record<string, any> = {};
      Object.entries(predictInputs).forEach(([key, value]) => {
        const numValue = Number(value);
        formattedInputs[key] = isNaN(numValue) ? value : numValue;
      });
      
      const response = await fetch(`/prediction/predict-manual/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experiment_id: experimentId,
          inputs: formattedInputs
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to make prediction');
      }
      
      const result = await response.json();
      setPredictResult(result);
      
      toast({
        title: "Prediction Complete",
        description: "Successfully generated prediction",
      });
    } catch (err) {
      console.error('Prediction error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to make prediction';
      setPredictError(errorMessage);
      toast({
        title: "Prediction Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsPredicting(false);
    }
  };
  
  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setBatchError('Please select a CSV file');
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
      setBatchError(null);
    }
  };
  
  const handleBatchPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setBatchError('Please select a CSV file');
      return;
    }
    
    setIsBatchLoading(true);
    setBatchError(null);
    setBatchResult(null);
    
    try {
      if (!experimentId) throw new Error('Experiment ID is required');
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('experiment_id', experimentId);
      
      const response = await fetch(`/prediction/predict-csv/`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process batch prediction');
      }
      
      const result = await response.json();
      setBatchResult(result);
      
      toast({
        title: "Batch Prediction Complete",
        description: result.metrics 
          ? "Successfully evaluated predictions against true values" 
          : "Successfully generated predictions for the CSV",
      });
    } catch (err) {
      console.error('Batch prediction error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process batch prediction';
      setBatchError(errorMessage);
      toast({
        title: "Batch Prediction Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsBatchLoading(false);
    }
  };
  
  const handleInputChange = (column: string, value: string) => {
    setPredictInputs(prev => ({
      ...prev,
      [column]: value
    }));
  };

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

  const { experiment_metadata, metrics, files, classificationReport, confusionMatrix, roc, prCurve } = results;

  const numberMetrics = metrics;
  
  const isVisualizationFile = (fileType: string) => {
    const visualTypes = ['distribution', 'shap', 'confusion_matrix', 'importance', 'plot', 'chart', 'graph', 'visualization'];
    return visualTypes.some(type => fileType.includes(type));
  };
  
  const downloadableFiles = Array.from(new Set(
    files.filter(file => 
      file.file_type === 'model' || 
      file.file_type.includes('report')
    ).map(file => file.file_url)
  )).map(url => {
    const file = files.find(f => f.file_url === url);
    return file ? file : null;
  }).filter(Boolean) as typeof files;
  
  const visualizationFiles = files.filter(file => 
    file.file_type !== 'model' && 
    !file.file_type.includes('report')
  );

  return (
    <Card className="w-full mt-6 border border-primary/20 rounded-lg shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">{experiment_metadata.experiment_name || 'Experiment Results'}</CardTitle>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {experiment_metadata.training_type === 'automl' || experiment_metadata.automl_engine 
              ? `Engine: ${experiment_metadata.automl_engine}` 
              : `Algorithm: ${experiment_metadata.algorithm_choice || experiment_metadata.algorithm || 'Auto-selected'}`}
          </Badge>
        </div>
        <CardDescription className="flex flex-wrap gap-x-4 mt-2">
          <span className="inline-flex items-center">
            <Activity className="h-3.5 w-3.5 mr-1" />
            Task: <span className="font-semibold ml-1">{formatTaskType(experiment_metadata.task_type)}</span>
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
            {Object.keys(results?.metrics || {}).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(results?.metrics || {}).map(([key, value]) => {
                  const isPercentageMetric = 
                    key.toLowerCase().includes("accuracy") ||
                    key.toLowerCase().includes("f1_score") ||
                    key.toLowerCase().includes("precision") ||
                    key.toLowerCase().includes("recall");
                    
                  const metricDisplayName = key.replace(/_/g, " ")
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                    
                  const numericValue = typeof value === 'number' ? value : 0;
                  
                  return (
                    <Card key={key} className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm capitalize">
                          {metricDisplayName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {isPercentageMetric
                            ? `${(numericValue * 100).toFixed(2)}%`
                            : numericValue.toFixed(4)}
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
            {results?.classificationReport && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">Classification Report</h3>
                <div className="bg-muted/40 p-4 rounded-md overflow-x-auto">
                  <ClassificationReportTable report={results.classificationReport} />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="visualizations" className="p-6">
            {results?.confusionMatrix && results.confusionMatrix.length > 0 && (
              <div className="mb-8">
                <ConfusionMatrixChart 
                  matrix={results.confusionMatrix} 
                  labels={undefined} 
                />
              </div>
            )}
            {results?.prCurve && (
              <div className="mb-8">
                <PrecisionRecallChart 
                  precision={results.prCurve.precision} 
                  recall={results.prCurve.recall} 
                  f1Score={results.prCurve.f1Score}
                />
              </div>
            )}
            {visualizationFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visualizationFiles.map((file, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="py-2 px-4 bg-muted/30">
                      <CardTitle className="text-sm font-medium capitalize">
                        {file.file_type.replace(/_/g, ' ')}
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
                          <a href={file.file_url} download={file.file_name} target="_blank" rel="noopener noreferrer">
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
                        <TableCell>{formatTaskType(experiment_metadata.task_type)}</TableCell>
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
                    {downloadableFiles.map((file, index) => (
                      <Button key={index} variant="outline" className="w-full justify-start" asChild>
                        <a href={file.file_url} download={file.file_name} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" /> 
                          Download {file.file_type.replace(/_/g, ' ')}
                        </a>
                      </Button>
                    ))}
                    
                    {downloadableFiles.length === 0 && (
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
            {downloadableFiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {downloadableFiles.map((file, index) => (
                  <Card key={index} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base capitalize">{file.file_type.replace(/_/g, ' ')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button asChild className="w-full">
                        <a href={file.file_url} download={file.file_name} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" /> 
                          Download {file.file_type.replace(/_/g, ' ')}
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
