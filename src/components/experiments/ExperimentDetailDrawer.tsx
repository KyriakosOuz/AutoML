
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  FileText, 
  Clock,
  Info,
  BarChart4,
  Settings,
  Terminal,
  AlertTriangle,
  Trash2,
  ArrowUpDown
} from 'lucide-react';
import { ExperimentResults, ExperimentStatus, PerClassMetric } from '@/types/training';
import { useToast } from '@/hooks/use-toast';
import { formatTrainingTime } from '@/utils/formatUtils';
import { formatDateForGreece } from '@/lib/dateUtils';
import { trainingApi } from '@/lib/api';

// Add a helper function to get the F1 score accounting for naming variations
const getF1Score = (metrics: any): number | undefined => {
  if (!metrics) return undefined;
  return metrics.f1_score !== undefined ? metrics.f1_score : 
         metrics['f1-score'] !== undefined ? metrics['f1-score'] : metrics.f1;
};

interface ExperimentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedExperiment: ExperimentResults | null;
  onDelete?: (experimentId: string) => void;
  onRefresh?: (experimentId: string) => void;
  // Add experimentId as an alternative to selectedExperiment for backward compatibility
  experimentId?: string;
}

const ExperimentDetailDrawer: React.FC<ExperimentDetailDrawerProps> = ({
  isOpen,
  onClose,
  selectedExperiment,
  experimentId, // Add this prop to handle legacy usages
  onDelete,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const { toast } = useToast();

  // Reset active tab when experiment changes
  useEffect(() => {
    if (isOpen && selectedExperiment) {
      setActiveTab('overview');
    }
  }, [isOpen, selectedExperiment]);

  if (!selectedExperiment) {
    return null;
  }

  const handleDelete = async () => {
    if (!selectedExperiment.experiment_id && !selectedExperiment.id) {
      toast({
        title: "Error",
        description: "No experiment ID found",
        variant: "destructive"
      });
      return;
    }

    const experimentId = selectedExperiment.experiment_id || selectedExperiment.id as string;
    
    try {
      setIsDeleting(true);
      
      if (onDelete) {
        await onDelete(experimentId);
        toast({
          title: "Success",
          description: "Experiment deleted successfully"
        });
        onClose();
      }
    } catch (error) {
      console.error("Error deleting experiment:", error);
      toast({
        title: "Error",
        description: "Failed to delete experiment",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedExperiment.experiment_id && !selectedExperiment.id) {
      toast({
        title: "Error",
        description: "No experiment ID found",
        variant: "destructive"
      });
      return;
    }

    const experimentId = selectedExperiment.experiment_id || selectedExperiment.id as string;
    
    try {
      setIsRefreshing(true);
      
      if (onRefresh) {
        await onRefresh(experimentId);
        toast({
          title: "Success",
          description: "Experiment data refreshed"
        });
      }
    } catch (error) {
      console.error("Error refreshing experiment:", error);
      toast({
        title: "Error",
        description: "Failed to refresh experiment data",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format status for display
  const formatStatus = (status: ExperimentStatus) => {
    switch (status) {
      case 'completed':
      case 'success':
        return { label: 'Completed', variant: 'default' as const }; // Changed from 'success' to 'default'
      case 'running':
      case 'processing':
        return { label: 'Running', variant: 'default' as const };
      case 'failed':
      case 'error':
        return { label: 'Failed', variant: 'destructive' as const };
      default:
        return { label: status, variant: 'secondary' as const };
    }
  };

  const statusInfo = formatStatus(selectedExperiment.status);

  // Format created_at date
  const formattedCreatedAt = selectedExperiment.created_at 
    ? formatDateForGreece(new Date(selectedExperiment.created_at), 'PP p')
    : 'N/A';

  // Format completed_at date if available
  const formattedCompletedAt = selectedExperiment.completed_at
    ? formatDateForGreece(new Date(selectedExperiment.completed_at), 'PP p')
    : 'N/A';

  // Format task type for display
  const formatTaskType = (type: string = '') => {
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

  // Render overview content
  const renderOverviewContent = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Task Type</div>
                <div className="font-medium">{formatTaskType(selectedExperiment.task_type)}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Target Column</div>
                <div className="font-medium">{selectedExperiment.target_column || 'N/A'}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Created At</div>
                <div className="font-medium">{formattedCreatedAt}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Completed At</div>
                <div className="font-medium">{formattedCompletedAt}</div>
              </div>
            </CardContent>
          </Card>
          
          {selectedExperiment.training_time_sec && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Training Time</div>
                  <div className="font-medium">{formatTrainingTime(selectedExperiment.training_time_sec)}</div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {selectedExperiment.algorithm || selectedExperiment.algorithm_choice || selectedExperiment.selected_algorithm ? (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Algorithm</div>
                  <div className="font-medium">
                    {selectedExperiment.algorithm || 
                     selectedExperiment.algorithm_choice || 
                     selectedExperiment.selected_algorithm || 
                     'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
          
          {selectedExperiment.automl_engine && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">AutoML Engine</div>
                  <div className="font-medium">{selectedExperiment.automl_engine.toUpperCase()}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {selectedExperiment.error_message && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive">Error</h4>
                <p className="text-sm text-destructive/90 mt-1">{selectedExperiment.error_message}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render metrics content
  const renderMetricsContent = () => {
    if (!selectedExperiment?.metrics) {
      return <p className="text-muted-foreground">No metrics available</p>;
    }

    const { metrics } = selectedExperiment;
    const isMulticlassClassification = 
      selectedExperiment.task_type === 'multiclass_classification';
    const isMLJAREngine = selectedExperiment.automl_engine === 'mljar';
    
    // Check for per-class metrics nested under metrics.per_class (MLJAR)
    const hasPerClassMetrics = 
      isMulticlassClassification && 
      metrics.per_class && 
      Object.keys(metrics.per_class).length > 0;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(metrics).map(([key, value]) => {
            // Skip per_class since we'll render it separately
            if (key === 'per_class' || key === 'source' || typeof value !== 'number') {
              return null;
            }
            
            // Format the metric name and value
            const metricName = key.replace(/_/g, ' ');
            const isPercentMetric = ['accuracy', 'precision', 'recall', 'f1', 'f1_score', 'f1-score'].includes(key);
            const formattedValue = isPercentMetric 
              ? `${(Number(value) * 100).toFixed(2)}%` 
              : Number(value).toFixed(4);
            
            return (
              <div key={key} className="bg-card p-2 rounded-md shadow border">
                <div className="text-xs text-muted-foreground capitalize">{metricName}</div>
                <div className="text-lg font-semibold">{formattedValue}</div>
              </div>
            );
          })}
        </div>
        
        {/* Render per-class metrics table for multiclass classification */}
        {hasPerClassMetrics && (
          <div className="mt-6">
            <h3 className="text-base font-semibold mb-2">Per-Class Metrics</h3>
            <div className="border rounded-md overflow-hidden">
              <ResponsiveTable minWidth="500px">
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Precision</TableHead>
                    <TableHead>Recall</TableHead>
                    <TableHead>F1 Score</TableHead>
                    <TableHead>Support</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(metrics.per_class).map(([className, classMetrics]) => {
                    // Fix TypeScript error by properly casting to an acceptable type
                    const classMetricsObj = classMetrics as unknown as Record<string, number>;
                    
                    // Access metrics with proper type safety
                    const precision = classMetricsObj.precision;
                    const recall = classMetricsObj.recall;
                    const f1 = getF1Score(classMetricsObj);
                    const support = classMetricsObj.support;
                    
                    // Determine cell color based on metric value
                    const getMetricColor = (value: number | undefined) => {
                      if (value === undefined) return "";
                      if (value >= 0.7) return "text-green-600";
                      if (value >= 0.5) return "text-amber-600";
                      if (value >= 0.3) return "text-orange-600";
                      return "text-red-600";
                    };
                    
                    return (
                      <TableRow key={className}>
                        <TableCell className="font-medium">{className}</TableCell>
                        <TableCell className={getMetricColor(precision)}>
                          {precision !== undefined ? `${(precision * 100).toFixed(2)}%` : 'N/A'}
                        </TableCell>
                        <TableCell className={getMetricColor(recall)}>
                          {recall !== undefined ? `${(recall * 100).toFixed(2)}%` : 'N/A'}
                        </TableCell>
                        <TableCell className={getMetricColor(f1)}>
                          {f1 !== undefined ? `${(f1 * 100).toFixed(2)}%` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {support !== undefined ? support.toLocaleString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </ResponsiveTable>
            </div>
          </div>
        )}
        
        {/* Keep existing classification report rendering if available */}
        {metrics.classification_report && (
          <div className="mt-6">
            <h3 className="text-base font-semibold mb-2">Classification Report</h3>
            <div className="bg-muted p-4 rounded-md">
              <pre className="whitespace-pre-wrap text-xs font-mono overflow-x-auto">
                {typeof metrics.classification_report === 'string' 
                  ? metrics.classification_report 
                  : JSON.stringify(metrics.classification_report, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render configuration content
  const renderConfigContent = () => {
    const { hyperparameters, columns_to_keep } = selectedExperiment;
    
    return (
      <div className="space-y-6">
        {/* Hyperparameters section */}
        {hyperparameters && Object.keys(hyperparameters).length > 0 && (
          <div>
            <h3 className="text-base font-semibold mb-2">Hyperparameters</h3>
            <div className="border rounded-md overflow-hidden">
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
            </div>
          </div>
        )}
        
        {/* Selected columns section */}
        {columns_to_keep && columns_to_keep.length > 0 && (
          <div>
            <h3 className="text-base font-semibold mb-2">Selected Features</h3>
            <div className="flex flex-wrap gap-2">
              {columns_to_keep.map((column, index) => (
                <Badge key={index} variant="secondary">
                  {column}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* If no configuration data available */}
        {(!hyperparameters || Object.keys(hyperparameters).length === 0) && 
         (!columns_to_keep || columns_to_keep.length === 0) && (
          <p className="text-muted-foreground">No configuration details available</p>
        )}
      </div>
    );
  };

  // Render files content
  const renderFilesContent = () => {
    const { files } = selectedExperiment;
    
    if (!files || files.length === 0) {
      return <p className="text-muted-foreground">No files available</p>;
    }
    
    // Group files by type
    const filesByType: Record<string, typeof files> = {};
    
    files.forEach(file => {
      const type = file.file_type || 'other';
      if (!filesByType[type]) {
        filesByType[type] = [];
      }
      filesByType[type].push(file);
    });
    
    return (
      <div className="space-y-6">
        {Object.entries(filesByType).map(([type, typeFiles]) => (
          <div key={type}>
            <h3 className="text-base font-semibold mb-2 capitalize">
              {type.replace(/_/g, ' ')}
            </h3>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typeFiles.map((file, index) => {
                    const fileName = file.file_name || `${type}_${index + 1}`;
                    const createdAt = file.created_at 
                      ? formatDateForGreece(new Date(file.created_at), 'PP')
                      : 'N/A';
                    
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{fileName}</TableCell>
                        <TableCell>{createdAt}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" asChild>
                            <a 
                              href={file.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              download
                            >
                              Download
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md md:max-w-lg lg:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>{selectedExperiment.experiment_name || 'Experiment Details'}</SheetTitle>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
          <SheetDescription>
            {selectedExperiment.experiment_id || selectedExperiment.id}
          </SheetDescription>
        </SheetHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">
              <Info className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="metrics">
              <BarChart4 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Metrics</span>
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
            <TabsTrigger value="files">
              <FileText className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Files</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            {renderOverviewContent()}
          </TabsContent>
          
          <TabsContent value="metrics" className="mt-0">
            {renderMetricsContent()}
          </TabsContent>
          
          <TabsContent value="config" className="mt-0">
            {renderConfigContent()}
          </TabsContent>
          
          <TabsContent value="files" className="mt-0">
            {renderFilesContent()}
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between mt-8 pt-4 border-t">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting || !onDelete}
                >
                  {isDeleting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete this experiment permanently</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Refresh Data
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ExperimentDetailDrawer;
