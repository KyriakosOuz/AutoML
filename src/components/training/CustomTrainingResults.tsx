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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  BarChart4, 
  Clock, 
  Image as ImageIcon, 
  RefreshCw,
  DownloadCloud,
  Activity,
  LineChart,
  Table as TableIcon,
  BookOpen
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

  const { 
    experiment_id, 
    experiment_name, 
    target_column, 
    task_type, 
    metrics = {}, 
    files = [],
    algorithm
  } = experimentResults;

  const isClassification = task_type?.includes('classification');
  
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

  const filesByType = files.reduce((acc, file) => {
    const type = file.file_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(file);
    return acc;
  }, {} as Record<string, typeof files>);

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle>{experiment_name || 'Custom Training Results'}</CardTitle>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            {algorithm || task_type.replace(/_/g, ' ')}
          </Badge>
        </div>
        <CardDescription>
          Target: <span className="font-medium">{target_column}</span> • 
          Task: <span className="font-medium">{task_type.replace(/_/g, ' ')}</span> • 
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
              
              {!isClassification && (
                <>
                  {metrics.r2_score !== undefined && (
                    <Card className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">R² Score</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className={`text-2xl font-bold ${getMetricColor(metrics.r2_score)}`}>
                          {formatRegressionMetric(metrics.r2_score)}
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
            {files.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {files.map((file, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <Card className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="aspect-video bg-muted flex flex-col items-center justify-center rounded-md relative overflow-hidden">
                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${file.file_url})` }}></div>
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
          
          <TabsContent value="report" className="p-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Classification Report</CardTitle>
                <CardDescription>
                  Detailed metrics breakdown by class
                </CardDescription>
              </CardHeader>
              <CardContent>
                {typeof metrics.classification_report === 'string' ? (
                  <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-xs font-mono overflow-x-auto">
                    {metrics.classification_report}
                  </pre>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class</TableHead>
                        <TableHead>Precision</TableHead>
                        <TableHead>Recall</TableHead>
                        <TableHead>F1-Score</TableHead>
                        <TableHead>Support</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(metrics.classification_report || {}).map(([className, values]: [string, any]) => {
                        if (className === 'accuracy' || typeof values !== 'object') return null;
                        return (
                          <TableRow key={className}>
                            <TableCell className="font-medium">{className}</TableCell>
                            <TableCell>{formatMetric(values.precision)}</TableCell>
                            <TableCell>{formatMetric(values.recall)}</TableCell>
                            <TableCell>{formatMetric(values.f1_score)}</TableCell>
                            <TableCell>{values.support}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="justify-between border-t p-4">
        <Button variant="outline" onClick={onReset}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Run Another Experiment
        </Button>
        
        <Button variant="outline" asChild>
          <a href={`/models/${experiment_id}`} target="_blank" rel="noopener noreferrer">
            <BookOpen className="h-4 w-4 mr-2" />
            View Full Report
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CustomTrainingResults;
