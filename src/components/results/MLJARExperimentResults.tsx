
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Award, 
  BarChart4, 
  Download, 
  RefreshCw, 
  FileText, 
  Activity,
  Clock,
  Target,
  Zap,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { ExperimentResults } from '@/types/training';
import { formatTrainingTime } from '@/utils/formatUtils';
import { downloadFile } from '@/components/training/prediction/utils/downloadUtils';
import NewMLJARCharts from './NewMLJARCharts';

interface MLJARExperimentResultsProps {
  experimentId: string;
  status: 'completed' | 'success' | 'failed';
  experimentResults: ExperimentResults | null;
  isLoading: boolean;
  error: string | null;
  onReset: () => void;
  onRefresh: () => void;
}

interface MetricDisplay {
  label: string;
  value: string | number | undefined;
  colorClass: string;
  formatter?: (value: number | undefined) => string;
}

const MLJARExperimentResults: React.FC<MLJARExperimentResultsProps> = ({
  experimentId,
  status,
  experimentResults,
  isLoading,
  error,
  onReset,
  onRefresh
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (status === 'failed' && error) {
      toast({
        title: "Training Failed",
        description: `Experiment failed: ${error}`,
        variant: "destructive"
      });
    } else if (status === 'completed' || status === 'success') {
      toast({
        title: "Training Completed",
        description: "Model training completed successfully!"
      });
    }
  }, [status, error, toast]);

  const results = experimentResults;
  if (!results) return null;

  const {
    experiment_name,
    model_display_name,
    task_type,
    target_column,
    metrics = {},
    files = [],
    training_time_sec,
    completed_at,
    automl_engine
  } = results;

  const formatMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return (value * 100).toFixed(2) + '%';
  };

  const getMetricColor = (value: number | undefined) => {
    if (value === undefined) return 'text-gray-400';
    if (value >= 0.9) return 'text-green-600';
    if (value >= 0.7) return 'text-emerald-600';
    if (value >= 0.5) return 'text-amber-600';
    return 'text-red-600';
  };

  const metricDisplays: MetricDisplay[] = [
    {
      label: 'Accuracy',
      value: metrics?.accuracy,
      colorClass: getMetricColor(metrics?.accuracy),
      formatter: formatMetric
    },
    {
      label: 'Precision',
      value: metrics?.precision,
      colorClass: getMetricColor(metrics?.precision),
      formatter: formatMetric
    },
    {
      label: 'Recall',
      value: metrics?.recall,
      colorClass: getMetricColor(metrics?.recall),
      formatter: formatMetric
    },
    {
      label: 'F1 Score',
      value: metrics?.f1_score,
      colorClass: getMetricColor(metrics?.f1_score),
      formatter: formatMetric
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{model_display_name || experiment_name || 'MLJAR Experiment Results'}</CardTitle>
            </div>
            <Badge variant="outline">{automl_engine?.toUpperCase() || 'AutoML'}</Badge>
          </div>
          <CardDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              <div>
                <Target className="h-4 w-4 mr-1 inline-block" />
                Target: {target_column}
              </div>
              <div>
                <Zap className="h-4 w-4 mr-1 inline-block" />
                Task: {task_type?.replace('_', ' ') || 'Unknown'}
              </div>
            </div>
          </CardDescription>
        </CardHeader>
      </Card>

      {isLoading && (
        <Card className="border-primary/20">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <TrendingUp className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Loading Results...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-primary/20">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-4 rounded-none border-b h-12">
              <TabsTrigger value="overview" className="text-sm flex items-center gap-1">
                <Award className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              
              <TabsTrigger value="metrics" className="text-sm flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span>Metrics</span>
              </TabsTrigger>
              
              <TabsTrigger value="charts" className="text-sm flex items-center gap-1">
                <BarChart4 className="h-4 w-4" />
                <span>Charts</span>
              </TabsTrigger>
              
              <TabsTrigger value="files" className="text-sm flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>Files</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Experiment Details</CardTitle>
                    <CardDescription>Information about this experiment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p>
                        <Info className="h-4 w-4 mr-1 inline-block" />
                        Experiment ID: {experimentId}
                      </p>
                      <p>
                        <Clock className="h-4 w-4 mr-1 inline-block" />
                        Training Time: {formatTrainingTime(training_time_sec)}
                      </p>
                      {completed_at && (
                        <p>
                          <CheckCircle className="h-4 w-4 mr-1 inline-block" />
                          Completed At: {new Date(completed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between">
                    <Button variant="outline" onClick={onReset}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Run New Experiment
                    </Button>
                    <Button onClick={onRefresh}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metricDisplays.map((metric, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{metric.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${metric.colorClass}`}>
                        {metric.formatter ? metric.formatter(metric.value as number) : metric.value}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="charts" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Model Performance Charts</h3>
                    <p className="text-sm text-muted-foreground">
                      Visual analysis of your model's performance
                    </p>
                  </div>
                </div>
                
                <NewMLJARCharts files={files} />
              </div>
            </TabsContent>

            <TabsContent value="files" className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Experiment Files</h3>
                <p className="text-sm text-muted-foreground">
                  Downloadable files produced during the experiment.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {files.map((file, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle>{file.file_type}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(file.created_at).toLocaleString()}
                        </p>
                        <Button variant="outline" size="sm" onClick={() => downloadFile(file.file_url, file.file_type)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Run New Experiment
          </Button>
          <Button onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MLJARExperimentResults;
