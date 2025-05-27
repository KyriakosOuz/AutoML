
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ExperimentResults, TrainingFile } from '@/types/training';
import { Download, BarChart4, Activity, FileText, Clock } from 'lucide-react';
import { formatTrainingTime } from '@/utils/formatUtils';
import { downloadFile } from '@/components/training/prediction/utils/downloadUtils';

interface MLJARExperimentResultsProps {
  experimentResults: ExperimentResults;
  status: string;
  isLoading: boolean;
  error: string | null;
  onReset: () => void;
  onRefresh: () => void;
}

// Helper function to get chart title based on file type and URL
const getChartTitle = (file: TrainingFile): string => {
  // Check if this is a normalized confusion matrix
  if (file.file_type === 'confusion_matrix' && 
      file.file_url.toLowerCase().includes('normalized')) {
    return "Normalized Confusion Matrix";
  }
  
  // Check curve_subtype for specific curve types
  if (file.curve_subtype) {
    const subtypeMap: Record<string, string> = {
      roc: "ROC Curve",
      precision_recall: "Precision-Recall Curve",
      calibration: "Calibration Curve", 
      lift: "Lift Curve",
      ks: "KS Statistic",
      learning: "Learning Curve"
    };
    
    return subtypeMap[file.curve_subtype] || file.curve_subtype.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  // Check for known file_type patterns
  const fileTypeMap: Record<string, string> = {
    confusion_matrix: "Confusion Matrix",
    calibration_curve: "Calibration Curve",
    cumulative_gains: "Cumulative Gains Curve",
    lift_curve: "Lift Curve",
    learning_curve: "Learning Curve",
    ks_statistic: "KS Statistic",
    feature_importance: "Feature Importance",
    evaluation_curve: "Evaluation Curve"
  };
  
  // Try to match known file types
  for (const [key, value] of Object.entries(fileTypeMap)) {
    if (file.file_type?.toLowerCase().includes(key)) {
      return value;
    }
  }
  
  // Default to formatted file_type
  return file.file_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Filter and categorize visualization files
const getVisualizationFiles = (files: TrainingFile[]): TrainingFile[] => {
  console.log('MLJARExperimentResults - All Files:', files);
  
  // Filter only PNG image files for visualization
  const visualizationFiles = files.filter(file => {
    // Must have a file_url and be a PNG file
    if (!file.file_url || !file.file_url.toLowerCase().endsWith('.png')) {
      return false;
    }
    
    // Exclude model files, CSV files, and readme files
    if (
      file.file_type?.includes('model') || 
      file.file_url?.toLowerCase().includes('model') ||
      file.file_type?.includes('csv') || 
      file.file_url?.toLowerCase().includes('csv') ||
      file.file_type?.includes('readme') || 
      file.file_url?.toLowerCase().includes('readme') ||
      file.file_type?.includes('metadata') ||
      file.file_url?.toLowerCase().includes('metadata')
    ) {
      return false;
    }
    
    return true;
  });

  console.log('MLJARExperimentResults - Filtered Visualization Files:', visualizationFiles);
  console.log('MLJARExperimentResults - File Types:', visualizationFiles.map(f => f.file_type));
  
  return visualizationFiles;
};

// Charts component for MLJAR visualizations
const MLJARCharts: React.FC<{ files: TrainingFile[] }> = ({ files }) => {
  const visualizationFiles = getVisualizationFiles(files);

  if (visualizationFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart4 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Visualizations Available</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Visualizations may not be available for this model or are still being generated.
        </p>
      </div>
    );
  }

  // Group visualizations by type for better organization
  const groupedVisualizations = visualizationFiles.reduce((groups: Record<string, TrainingFile[]>, file) => {
    const title = getChartTitle(file);
    if (!groups[title]) {
      groups[title] = [];
    }
    groups[title].push(file);
    return groups;
  }, {});

  console.log('MLJARExperimentResults - Grouped Visualizations:', groupedVisualizations);

  return (
    <div className="space-y-8">
      {Object.entries(groupedVisualizations).map(([title, files], groupIndex) => (
        <div key={`group-${groupIndex}`} className="space-y-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file, index) => (
              <Card key={`${groupIndex}-${index}`} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {files.length > 1 ? `${title} ${index + 1}` : title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="cursor-pointer hover:opacity-90 transition-opacity">
                        <img 
                          src={file.file_url} 
                          alt={title} 
                          className="w-full h-auto rounded-md object-contain"
                          style={{ maxHeight: "200px" }}
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <div className="p-2">
                        <img 
                          src={file.file_url} 
                          alt={title} 
                          className="w-full rounded-md"
                        />
                        <div className="mt-4 flex justify-between items-center">
                          <h3 className="font-medium">{title}</h3>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => downloadFile(
                              file.file_url, 
                              `${title.toLowerCase().replace(/\s+/g, '_')}.png`
                            )}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <div className="mt-2 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => downloadFile(
                        file.file_url, 
                        `${title.toLowerCase().replace(/\s+/g, '_')}.png`
                      )}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const MLJARExperimentResults: React.FC<MLJARExperimentResultsProps> = ({
  experimentResults,
  status,
  isLoading,
  error,
  onReset,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={onRefresh} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!experimentResults) {
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
    automl_engine,
    model_display_name
  } = experimentResults;

  // Display algorithm or engine based on what's available
  const displayAlgorithm = model_display_name || 
                          algorithm || 
                          (automl_engine ? `${automl_engine.toUpperCase()}` : 'MLJAR AutoML');

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">{experiment_name || 'MLJAR Experiment'}</CardTitle>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {displayAlgorithm}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-x-4 mt-2 text-sm text-muted-foreground">
          <span>Task: <span className="font-semibold">{task_type}</span></span>
          <span>Target: <span className="font-semibold">{target_column}</span></span>
          {training_time_sec && (
            <span className="inline-flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Time: <span className="font-semibold ml-1">{formatTrainingTime(training_time_sec)}</span>
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 rounded-none border-b h-12">
            <TabsTrigger value="overview" className="text-sm flex items-center gap-1">
              <Activity className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            
            <TabsTrigger value="charts" className="text-sm flex items-center gap-1">
              <BarChart4 className="h-4 w-4" />
              <span>Charts</span>
            </TabsTrigger>
            
            <TabsTrigger value="metrics" className="text-sm flex items-center gap-1">
              <Activity className="h-4 w-4" />
              <span>Metrics</span>
            </TabsTrigger>
            
            <TabsTrigger value="files" className="text-sm flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Files</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(metrics).map(([key, value]) => (
                <div key={key} className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-2xl font-semibold">
                    {typeof value === 'number' ? value.toFixed(4) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="charts" className="p-6">
            <MLJARCharts files={files} />
          </TabsContent>
          
          <TabsContent value="metrics" className="p-6">
            <div className="space-y-4">
              {Object.entries(metrics).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="font-medium">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className="font-mono">
                    {typeof value === 'number' ? value.toFixed(4) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="files" className="p-6">
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">{file.file_type}</p>
                    <p className="text-sm text-muted-foreground">{file.created_at}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(file.file_url, `${file.file_type}.${file.file_url.split('.').pop()}`)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MLJARExperimentResults;
