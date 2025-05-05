
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
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
import { 
  Award, 
  BarChart4, 
  Image as ImageIcon, 
  DownloadCloud,
  Activity,
  LineChart,
  Table as TableIcon,
  FileText
} from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExperimentResults } from '@/types/training';
import ClassificationReportTable from './ClassificationReportTable';

interface CustomTrainingResultsProps {
  experimentResults: ExperimentResults;
  onReset: () => void;
}

const formatTime = (date: string) => {
  try {
    return new Date(date).toLocaleString();
  } catch (e) {
    return 'N/A';
  }
};

const CustomTrainingResults: React.FC<CustomTrainingResultsProps> = ({ 
  experimentResults, 
  onReset 
}) => {
  const [activeTab, setActiveTab] = useState('metrics');
  
  console.log('[CustomTrainingResults] Rendering with experiment results:', {
    experimentId: experimentResults.experiment_id,
    experimentName: experimentResults.experiment_name,
    taskType: experimentResults.task_type,
    hasMetrics: !!experimentResults.metrics,
    metricsKeys: Object.keys(experimentResults.metrics || {}),
    hasClassificationReport: experimentResults.metrics ? 
      'classification_report' in experimentResults.metrics : false
  });

  const { 
    experiment_id, 
    experiment_name, 
    target_column, 
    task_type = '', // Provide default value to prevent undefined
    metrics = {}, 
    files = [],
    algorithm
  } = experimentResults;

  // Helper function to filter files by type
  const isVisualizationFile = (file: any) => {
    const visualTypes = ['distribution', 'shap', 'confusion_matrix', 'importance', 'plot', 'chart', 'graph', 'visualization'];
    const nonVisualTypes = ['model', 'report', 'label_encoder'];
    
    // Return true if contains visual type and doesn't contain non-visual type
    return visualTypes.some(type => file.file_type.includes(type)) && 
           !nonVisualTypes.some(type => file.file_type.includes(type));
  };

  // Get model files - make sure to include only unique model files
  const modelFiles = files
    .filter(file => file.file_type === 'model' || file.file_type.includes('model'))
    // Remove duplicates based on file_url
    .filter((file, index, self) => 
      index === self.findIndex(f => f.file_url === file.file_url)
    );
  
  const firstModelFile = modelFiles.length > 0 ? modelFiles[0] : null;
  
  // Get visualization files (excluding models and reports)
  const visualizationFiles = files.filter(isVisualizationFile);

  // Check if task_type exists before using it
  const isClassification = task_type ? task_type.includes('classification') : false;
  const isRegression = task_type ? task_type.includes('regression') : false;
  
  const formatMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return typeof value === 'number' ? (value * 100).toFixed(2) + '%' : String(value);
  };
  
  const formatRegressionMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return typeof value === 'number' ? value.toFixed(4) : String(value);
  };
  
  const getMetricColor = (value: number | undefined) => {
    if (value === undefined) return 'text-gray-400';
    if (value >= 0.9) return 'text-green-600';
    if (value >= 0.7) return 'text-emerald-600';
    if (value >= 0.5) return 'text-amber-600';
    return 'text-red-600';
  };

  // Format task type for display with null check
  const formattedTaskType = task_type ? task_type.replace(/_/g, ' ') : 'unknown task';
  
  // Check and log classification report if it exists
  if (metrics && metrics.classification_report) {
    console.log('[CustomTrainingResults] Classification report type:', typeof metrics.classification_report);
    if (typeof metrics.classification_report === 'object') {
      console.log('[CustomTrainingResults] Classification report keys:', Object.keys(metrics.classification_report));
    }
  }

  return (
    <Card className="shadow-lg border-primary/10 mt-6">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle>{experiment_name || 'Custom Training Results'}</CardTitle>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            {algorithm || formattedTaskType}
          </Badge>
        </div>
        <CardDescription>
          Target: <span className="font-medium">{target_column}</span> • 
          Task: <span className="font-medium">{formattedTaskType}</span> • 
          ID: <span className="font-mono text-xs">{experiment_id}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b px-4">
            <TabsTrigger value="metrics" className="data-[state=active]:bg-primary/10">
              <Activity className="mr-1 h-4 w-4" /> 
              Metrics
            </TabsTrigger>
            <TabsTrigger value="visualizations" className="data-[state=active]:bg-primary/10">
              <BarChart4 className="mr-1 h-4 w-4" />
              Visualizations
            </TabsTrigger>
            {firstModelFile && (
              <TabsTrigger value="model" className="data-[state=active]:bg-primary/10">
                <FileText className="mr-1 h-4 w-4" />
                Model
              </TabsTrigger>
            )}
            {metrics.classification_report && (
              <TabsTrigger value="report" className="data-[state=active]:bg-primary/10">
                <TableIcon className="mr-1 h-4 w-4" />
                Classification Report
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="metrics" className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {isClassification && (
                <>
                  {metrics.accuracy !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Accuracy</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.accuracy)}`}>
                          {formatMetric(metrics.accuracy)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.f1_score !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">F1 Score</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.f1_score)}`}>
                          {formatMetric(metrics.f1_score)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.precision !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Precision</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.precision)}`}>
                          {formatMetric(metrics.precision)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.recall !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Recall</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.recall)}`}>
                          {formatMetric(metrics.recall)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
              
              {isRegression && (
                <>
                  {metrics.r2 !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">R² Score</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.r2)}`}>
                          {formatRegressionMetric(metrics.r2)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.mae !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Mean Absolute Error</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">
                          {formatRegressionMetric(metrics.mae)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.mse !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Mean Squared Error</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">
                          {formatRegressionMetric(metrics.mse)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {metrics.rmse !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">Root Mean Squared Error</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">
                          {formatRegressionMetric(metrics.rmse)}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="visualizations" className="p-6">
            {visualizationFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visualizationFiles.map((file, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <Card className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="aspect-video bg-muted flex flex-col items-center justify-center rounded-md relative overflow-hidden">
                            <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${file.file_url})` }}></div>
                            <div className="absolute inset-0 bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">
                              <ImageIcon className="h-8 w-8 text-white drop-shadow-md" />
                            </div>
                          </div>
                          <div className="mt-3 text-center">
                            <h3 className="font-medium text-sm">
                              {file.file_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </h3>
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
                          <h3 className="font-medium">
                            {file.file_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
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
                  Visualizations may not be available for this model or are still being generated.
                </p>
              </div>
            )}
          </TabsContent>

          {firstModelFile && (
            <TabsContent value="model" className="p-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Trained Model</CardTitle>
                  <CardDescription>Download the trained model file</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center py-4">
                    <Button asChild>
                      <a href={firstModelFile.file_url} download target="_blank" rel="noopener noreferrer">
                        <DownloadCloud className="h-4 w-4 mr-2" />
                        Download Model
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="report" className="p-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Classification Report</CardTitle>
                <CardDescription>
                  Detailed metrics breakdown by class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClassificationReportTable report={metrics.classification_report} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CustomTrainingResults;
