
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Award,
  BarChart4,
  Clock,
  FileText,
  RefreshCw,
  Layers,
  Settings,
  Activity,
  Microscope,
  Loader
} from 'lucide-react';
import { useTraining } from '@/contexts/training/TrainingContext';

import MetricsPanel from './MetricsPanel';
import VisualizationsPanel from './VisualizationsPanel';
import DetailsPanel from './DetailsPanel';
import ReportPanel from './ReportPanel';

export interface TrainingResultsV2Props {
  experimentId: string;
  onReset: () => void;
}

// Helper function to format task type
const formatTaskType = (type: string) => {
  if (!type) return "Unknown";
  switch (type) {
    case 'binary_classification':
      return 'Binary Classification';
    case 'multiclass_classification':
      return 'Multiclass Classification';
    case 'regression':
      return 'Regression';
    default:
      return type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  }
};

const TrainingResultsV2: React.FC<TrainingResultsV2Props> = ({
  experimentId,
  onReset
}) => {
  const { isLoadingResults, experimentResults } = useTraining();
  const [activeTab, setActiveTab] = useState<string>('metrics');
  const [error, setError] = useState<string | null>(null);

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
            <Award className="h-5 w-5 mr-2" />
            Training Error
          </CardTitle>
          <CardDescription>
            There was a problem with your experiment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md">
            <p className="text-destructive">{error}</p>
          </div>
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

  // Get unique downloadable files (model and report)
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
            <CardTitle className="text-xl">{experiment_name || 'Model Training Results'}</CardTitle>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {algorithm || formatTaskType(task_type)}
          </Badge>
        </div>

        <CardDescription className="flex flex-wrap gap-x-4 mt-2">
          <span className="inline-flex items-center">
            <Layers className="h-3.5 w-3.5 mr-1" />
            Task: <span className="font-semibold ml-1">{formatTaskType(task_type)}</span>
          </span>
          <span className="inline-flex items-center">
            <Microscope className="h-3.5 w-3.5 mr-1" />
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
              <span>Configuration</span>
            </TabsTrigger>
            <TabsTrigger value="report" className="text-sm flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Report</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="metrics" className="p-6">
            <MetricsPanel taskType={task_type} metrics={metrics} />
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
            <VisualizationsPanel files={visualizationFiles} />
          </TabsContent>
          <TabsContent value="details" className="p-6">
            <DetailsPanel
              experimentId={experimentId}
              algorithm={algorithm}
              taskType={task_type}
              targetColumn={target_column}
              columnsToKeep={columns_to_keep}
              hyperparameters={hyperparameters}
            />
          </TabsContent>
          <TabsContent value="report" className="p-6">
            <ReportPanel modelFileUrl={model_file_url} reportFileUrl={report_file_url} />
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

export default TrainingResultsV2;
