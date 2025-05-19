import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { 
  Award, 
  BarChart4, 
  Clock, 
  Download, 
  FileText, 
  RefreshCw, 
  Table as TableIcon,
  Info,
  Loader,
  Image,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet
} from 'lucide-react';
import { ExperimentResults, PerClassMetric, VisualizationsGrouped } from '@/types/training';
import { ExperimentStatus } from '@/contexts/training/types';
import { formatTrainingTime } from '@/utils/formatUtils';
import { formatDateForGreece } from '@/lib/dateUtils';
import CSVPreview from './CSVPreview';
import { downloadFile, downloadJSON } from '../training/prediction/utils/downloadUtils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MLJARExperimentResultsProps {
  experimentId: string | null;
  status: ExperimentStatus;
  experimentResults: ExperimentResults | null;
  isLoading: boolean;
  error: string | null;
  onReset?: () => void;
  onRefresh?: () => void;
}

// Helper function to format task type
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

// New function to render grouped visualizations
const renderGroupedVisualizations = (visualizations_grouped: VisualizationsGrouped) => {
  if (!visualizations_grouped || Object.keys(visualizations_grouped).length === 0) {
    return (
      <div className="text-center py-12">
        <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Charts Available</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No visualization files were found for this experiment.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {Object.entries(visualizations_grouped).map(([groupName, visualizations]) => (
        <div key={groupName} className="mb-8">
          <h3 className="text-lg font-medium mb-4">{groupName}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {visualizations.map((visualization, index) => (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {visualization.curve_subtype 
                          ? `${groupName} (${visualization.curve_subtype})` 
                          : groupName}
                      </CardTitle>
                      {visualization.created_at && (
                        <CardDescription className="text-xs">
                          {formatDateForGreece(new Date(visualization.created_at), 'PP p')}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="aspect-video bg-muted flex justify-center items-center rounded-md relative overflow-hidden">
                        <img 
                          src={visualization.file_url} 
                          alt={`${groupName} ${visualization.curve_subtype || ''}`}
                          className="object-contain max-h-full w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>
                      {visualization.curve_subtype 
                        ? `${groupName} (${visualization.curve_subtype})` 
                        : groupName}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="p-1">
                    <img 
                      src={visualization.file_url} 
                      alt={`${groupName} ${visualization.curve_subtype || ''}`}
                      className="w-full rounded-md"
                    />
                    <div className="mt-4 flex justify-end">
                      <Button variant="outline" size="sm" asChild>
                        <a 
                          href={visualization.file_url} 
                          download 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Image
                        </a>
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const MLJARExperimentResults: React.FC<MLJARExperimentResultsProps> = ({
  experimentId,
  status,
  experimentResults,
  isLoading,
  error,
  onReset,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<string>('summary');

  // Log when the component renders to help debug issues with visuals and metrics
  useEffect(() => {
    if (experimentResults) {
      console.log("[MLJARExperimentResults] Rendering with metrics:", {
        metricKeys: experimentResults.metrics ? Object.keys(experimentResults.metrics) : [],
        hasVisualizationsGrouped: !!experimentResults.visualizations_grouped,
        visualizationGroups: experimentResults.visualizations_grouped ? 
          Object.keys(experimentResults.visualizations_grouped) : [],
        allFiles: experimentResults.files ? experimentResults.files.map(f => f.file_type) : []
      });
    }
  }, [experimentResults]);

  if (isLoading || status === 'processing' || status === 'running') {
    return (
      <Card className="w-full mt-6 rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Award className="h-5 w-5 mr-2 text-primary" />
            Loading MLJAR Results
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
              Loading MLJAR experiment data...
            </p>
            {experimentId && (
              <p className="text-xs font-mono text-muted-foreground">
                Experiment ID: {experimentId}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !experimentResults) {
    return (
      <Card className="w-full mt-6 rounded-lg shadow-md border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <Alert className="h-5 w-5 mr-2" />
            Error Loading Results
          </CardTitle>
          <CardDescription>
            There was a problem with your MLJAR experiment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{experimentResults?.error_message || error}</AlertDescription>
          </Alert>
          <div className="flex space-x-2 mt-4">
            {onReset && (
              <Button 
                variant="outline" 
                onClick={onReset}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            {onRefresh && (
              <Button 
                variant="secondary" 
                onClick={onRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mt-6 border border-primary/20 rounded-lg shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">
              {experimentResults.model_display_name || experimentResults.experiment_name || 'MLJAR Experiment Results'}
            </CardTitle>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            Engine: {experimentResults.automl_engine?.toUpperCase() || 'AutoML'}
          </Badge>
        </div>
        
        <CardDescription className="flex flex-wrap gap-x-4 mt-2">
          <span className="inline-flex items-center">
            <BarChart4 className="h-3.5 w-3.5 mr-1" />
            Task: <span className="font-semibold ml-1">{formatTaskType(experimentResults.task_type)}</span>
          </span>
          
          {experimentResults.target_column && (
            <span className="inline-flex items-center">
              <TableIcon className="h-3.5 w-3.5 mr-1" />
              Target: <span className="font-semibold ml-1">{experimentResults.target_column}</span>
            </span>
          )}
          
          <span className="inline-flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Created: <span className="font-semibold ml-1">
              {experimentResults.created_at ? formatDateForGreece(new Date(experimentResults.created_at), 'PP p') : 'N/A'}
            </span>
          </span>
          
          {experimentResults.experiment_id && (
            <span className="inline-flex items-center">
              <span className="font-mono text-xs text-muted-foreground">
                ID: {experimentResults.experiment_id.substring(0, 8)}
              </span>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 rounded-none border-b h-12">
            <TabsTrigger value="summary" className="text-sm flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span>Summary</span>
            </TabsTrigger>
            
            <TabsTrigger value="charts" className="text-sm flex items-center gap-1">
              <BarChart4 className="h-4 w-4" />
              <span>Charts</span>
            </TabsTrigger>
            
            <TabsTrigger value="predictions" className="text-sm flex items-center gap-1">
              <TableIcon className="h-4 w-4" />
              <span>Predictions</span>
            </TabsTrigger>
            
            <TabsTrigger value="metadata" className="text-sm flex items-center gap-1">
              <Info className="h-4 w-4" />
              <span>Model Details</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Experiment Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-sm text-muted-foreground">Task Type:</span>
                      <span className="text-sm font-medium">{formatTaskType(experimentResults.task_type)}</span>
                      
                      <span className="text-sm text-muted-foreground">Target Column:</span>
                      <span className="text-sm font-medium">{experimentResults.target_column}</span>
                      
                      <span className="text-sm text-muted-foreground">Best Model:</span>
                      <span className="text-sm font-medium">{experimentResults.metrics?.best_model_label || 'Not specified'}</span>
                      
                      <span className="text-sm text-muted-foreground">Created At:</span>
                      <span className="text-sm font-medium">{experimentResults.created_at ? formatDateForGreece(new Date(experimentResults.created_at), 'PP p') : 'N/A'}</span>
                      
                      {experimentResults.automl_engine && (
                        <>
                          <span className="text-sm text-muted-foreground">Engine:</span>
                          <span className="text-sm font-medium">{experimentResults.automl_engine.toUpperCase()}</span>
                        </>
                      )}
                      
                      {experimentResults.completed_at && (
                        <>
                          <span className="text-sm text-muted-foreground">Completed:</span>
                          <span className="text-sm font-medium">{experimentResults.completed_at ? formatDateForGreece(new Date(experimentResults.completed_at), 'PP p') : 'N/A'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-center">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {experimentResults.metrics?.metric_used || 'Metric'}
                      </h3>
                      <p className="text-3xl font-bold text-primary">
                        {experimentResults.metrics?.metric_value?.toFixed(4) || 'N/A'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {['accuracy', 'f1', 'precision', 'recall', 'logloss'].map((key) => {
                        const value = experimentResults.metrics?.[key];
                        if (value === undefined) return null;
                        
                        return (
                          <div key={key} className="p-3 bg-muted/40 rounded-md">
                            <span className="block text-sm text-muted-foreground">
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </span>
                            <span className="text-lg font-medium">
                              {value.toFixed(4)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="charts" className="p-6">
            {experimentResults.visualizations_grouped ? 
              renderGroupedVisualizations(experimentResults.visualizations_grouped) : 
              <div>No visualizations available.</div>}
          </TabsContent>
          
          <TabsContent value="predictions">
            {experimentResults.files?.some(file => file.file_type.includes('predictions')) ? (
              <Card>
                <CardHeader>
                  <CardTitle>Model Predictions</CardTitle>
                  <CardDescription>
                    Preview of predictions made by the MLJAR model
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CSVPreview
                    fileUrl={experimentResults.files.find(file => file.file_type.includes('predictions'))?.file_url}
                    downloadUrl={experimentResults.files.find(file => file.file_type.includes('predictions'))?.file_url}
                    maxRows={10}
                    engineName={experimentResults.automl_engine?.toUpperCase()}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12">
                <TableIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Predictions Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Prediction data is not available for this experiment.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="metadata" className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-center">Model File</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-2">
                  <Button asChild>
                    <a href={experimentResults.files?.find(file => file.file_type.includes('model'))?.file_url} download>
                      <Download className="h-4 w-4 mr-2" />
                      Download Model
                    </a>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-center">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => downloadJSON(experimentResults.files?.find(file => file.file_type.includes('metadata'))?.file_url, 'model_metadata.json')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download JSON
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-center">Documentation</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // Fetch and display README content
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Readme
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <div className="flex gap-2">
          {onReset && (
            <Button variant="outline" onClick={onReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              New Experiment
            </Button>
          )}
        </div>
        
        {experimentResults.completed_at && (
          <div className="text-xs text-muted-foreground flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formatDateForGreece(new Date(experimentResults.completed_at), 'PP p')}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default MLJARExperimentResults;
