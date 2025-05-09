
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Download, FileText, BarChart4, Activity, Table2, 
  Layers, ChevronDown, ChevronUp, ArrowUpRight, Info
} from 'lucide-react';
import { ExperimentResults } from '@/types/training';
import RocCurveChart from '../charts/RocCurveChart';
import PrecisionRecallChart from '../charts/PrecisionRecallChart';
import ConfusionMatrixChart from '../charts/ConfusionMatrixChart';
import { formatDistanceToNow } from 'date-fns';

interface H2OExperimentResultsProps {
  experimentResults: ExperimentResults;
}

interface FilesByType {
  feature_importance: Array<{file_type: string, file_url: string, created_at: string}>;
  explainability: Array<{file_type: string, file_url: string, created_at: string}>;
  evaluation: Array<{file_type: string, file_url: string, created_at: string}>;
  confusion_matrix: Array<{file_type: string, file_url: string, created_at: string}>;
  model: Array<{file_type: string, file_url: string, created_at: string}>;
  predictions: Array<{file_type: string, file_url: string, created_at: string}>;
  other: Array<{file_type: string, file_url: string, created_at: string}>;
}

const H2OExperimentResults: React.FC<H2OExperimentResultsProps> = ({ experimentResults }) => {
  const [activeTab, setActiveTab] = useState<string>('metrics');
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const { 
    metrics = {},
    files = [],
    task_type,
    leaderboard = [],
    training_time_sec,
    completed_at,
    automl_engine = 'h2o',
    experiment_id
  } = experimentResults;

  // Process files into categories for organized rendering
  const categorizeFiles = (): FilesByType => {
    const categories: FilesByType = {
      feature_importance: [],
      explainability: [],
      evaluation: [],
      confusion_matrix: [],
      model: [],
      predictions: [],
      other: []
    };

    files.forEach(file => {
      const { file_type, file_url, created_at } = file;
      
      if (file_type.includes('feature_importance')) {
        categories.feature_importance.push({ file_type, file_url, created_at });
      } else if (file_type.includes('shap') || file_type.includes('explain')) {
        categories.explainability.push({ file_type, file_url, created_at });
      } else if (file_type.includes('roc') || file_type.includes('precision_recall')) {
        categories.evaluation.push({ file_type, file_url, created_at });
      } else if (file_type.includes('confusion_matrix')) {
        categories.confusion_matrix.push({ file_type, file_url, created_at });
      } else if (file_type === 'model') {
        categories.model.push({ file_type, file_url, created_at });
      } else if (file_type.includes('prediction')) {
        categories.predictions.push({ file_type, file_url, created_at });
      } else {
        categories.other.push({ file_type, file_url, created_at });
      }
    });

    return categories;
  };

  const filesByType = categorizeFiles();

  // Format metrics based on task type
  const renderMetricValue = (value: any): string => {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'number') {
      // Format as percentage if between 0 and 1, otherwise as regular number
      return value >= 0 && value <= 1 
        ? `${(value * 100).toFixed(2)}%` 
        : value.toFixed(4);
    }
    return String(value);
  };

  const getMetricColor = (metric: string, value: number): string => {
    if (value === undefined || value === null) return '';
    
    // Different metrics have different thresholds for good values
    if (['accuracy', 'auc', 'r2', 'f1', 'precision', 'recall'].includes(metric)) {
      if (value >= 0.9) return 'text-green-600';
      if (value >= 0.7) return 'text-emerald-500';
      if (value >= 0.5) return 'text-amber-500';
      return 'text-red-500';
    } else if (['rmse', 'mae', 'mse', 'logloss'].includes(metric)) {
      // For error metrics, lower is better
      if (value < 0.1) return 'text-green-600';
      if (value < 0.3) return 'text-emerald-500';
      if (value < 0.5) return 'text-amber-500';
      return 'text-red-500';
    }
    
    return '';
  };

  // Function to render metrics based on task type
  const renderMetrics = () => {
    const metricsToShow = [];
    
    if (task_type?.includes('classification')) {
      // For classification tasks
      if (metrics.accuracy !== undefined) metricsToShow.push({ name: 'Accuracy', value: metrics.accuracy, key: 'accuracy' });
      if (metrics.auc !== undefined) metricsToShow.push({ name: 'AUC', value: metrics.auc, key: 'auc' });
      if (metrics.logloss !== undefined) metricsToShow.push({ name: 'Log Loss', value: metrics.logloss, key: 'logloss' });
      if (metrics.f1_score !== undefined) metricsToShow.push({ name: 'F1 Score', value: metrics.f1_score, key: 'f1' });
      if (metrics.precision !== undefined) metricsToShow.push({ name: 'Precision', value: metrics.precision, key: 'precision' });
      if (metrics.recall !== undefined) metricsToShow.push({ name: 'Recall', value: metrics.recall, key: 'recall' });
    } else if (task_type?.includes('regression')) {
      // For regression tasks
      if (metrics.mae !== undefined) metricsToShow.push({ name: 'MAE', value: metrics.mae, key: 'mae' });
      if (metrics.rmse !== undefined) metricsToShow.push({ name: 'RMSE', value: metrics.rmse, key: 'rmse' });
      if (metrics.r2 !== undefined) metricsToShow.push({ name: 'R²', value: metrics.r2, key: 'r2' });
      if (metrics.mse !== undefined) metricsToShow.push({ name: 'MSE', value: metrics.mse, key: 'mse' });
    }

    if (metricsToShow.length === 0) {
      return (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No metrics available</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricsToShow.map((metric) => (
          <Card key={metric.key} className="bg-card hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                {metric.name}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{getMetricDescription(metric.key)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getMetricColor(metric.key, metric.value)}`}>
                {renderMetricValue(metric.value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Helper function to get metric descriptions
  const getMetricDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      accuracy: 'Proportion of correct predictions among the total number of cases',
      auc: 'Area Under the ROC Curve, measures ability to distinguish between classes',
      logloss: 'Cross-entropy loss, measures performance of classification models',
      f1: 'Harmonic mean of precision and recall',
      precision: 'Ratio of true positives to all predicted positives',
      recall: 'Ratio of true positives to all actual positives',
      mae: 'Mean Absolute Error, average magnitude of errors in predictions',
      rmse: 'Root Mean Square Error, square root of the average squared differences',
      r2: 'Coefficient of determination, proportion of variance explained by the model',
      mse: 'Mean Squared Error, average of the squares of the errors'
    };
    
    return descriptions[key] || 'No description available';
  };

  // Function to render the leaderboard if available
  const renderLeaderboard = () => {
    if (!leaderboard || leaderboard.length === 0) {
      const leaderboardFile = filesByType.other.find(file => 
        file.file_type.includes('leaderboard') || file.file_type.includes('leader')
      );
      
      if (leaderboardFile) {
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Table2 className="h-5 w-5 mr-2 text-primary" />
                Model Leaderboard
              </CardTitle>
              <CardDescription>
                Download the full leaderboard with model comparison metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <a href={leaderboardFile.file_url} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download Leaderboard CSV
                </a>
              </Button>
            </CardContent>
          </Card>
        );
      }
      
      return null;
    }
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center">
              <Table2 className="h-5 w-5 mr-2 text-primary" />
              Model Leaderboard
            </CardTitle>
            <CardDescription>
              Comparison of all models trained during AutoML
            </CardDescription>
          </div>
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="text-xs"
            >
              {showLeaderboard ? (
                <> 
                  <ChevronUp className="h-4 w-4 mr-1" /> 
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" /> 
                  Show All ({leaderboard.length})
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">
                    {task_type?.includes('classification') ? 'AUC' : 'RMSE'}
                  </TableHead>
                  <TableHead className="text-right">
                    {task_type?.includes('classification') ? 'Accuracy' : 'MAE'}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard
                  .slice(0, showLeaderboard ? undefined : 5)
                  .map((model: any, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="font-medium">{model.model_id || model.algorithm || `Model ${i+1}`}</span>
                          {i === 0 && (
                            <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 text-xs">
                              Best
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {task_type?.includes('classification') 
                          ? renderMetricValue(model.auc) 
                          : renderMetricValue(model.rmse)}
                      </TableCell>
                      <TableCell className="text-right">
                        {task_type?.includes('classification') 
                          ? renderMetricValue(model.accuracy) 
                          : renderMetricValue(model.mae)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render evaluation metrics and charts for binary classification
  const renderBinaryClassificationEvaluation = () => {
    if (!metrics || !task_type?.includes('binary_classification')) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.fpr && metrics.tpr && metrics.auc && (
          <RocCurveChart fpr={metrics.fpr} tpr={metrics.tpr} auc={metrics.auc} />
        )}
        {metrics.precision && metrics.recall && (
          <PrecisionRecallChart 
            precision={metrics.precision} 
            recall={metrics.recall} 
            f1Score={metrics.f1_score}
          />
        )}
        {metrics.confusion_matrix && (
          <div className="md:col-span-2">
            <ConfusionMatrixChart 
              matrix={metrics.confusion_matrix}
              labels={metrics.class_labels || []}
            />
          </div>
        )}
      </div>
    );
  };

  // Function to render visualizations if available
  const renderVisualizations = () => {
    const hasFeatureImportance = filesByType.feature_importance.length > 0;
    const hasExplainability = filesByType.explainability.length > 0;
    const hasEvaluation = filesByType.evaluation.length > 0;
    const hasConfusionMatrix = filesByType.confusion_matrix.length > 0;
    const hasCharts = renderBinaryClassificationEvaluation() !== null;
    
    if (!hasFeatureImportance && !hasExplainability && !hasEvaluation && !hasConfusionMatrix && !hasCharts) {
      return (
        <Card className="bg-muted/30">
          <CardContent className="pt-6 pb-6 text-center">
            <BarChart4 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No visualizations available for this experiment</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-8">
        {hasCharts && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary" />
              Model Performance
            </h3>
            {renderBinaryClassificationEvaluation()}
          </div>
        )}

        {hasFeatureImportance && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <BarChart4 className="h-5 w-5 mr-2 text-primary" />
              Feature Importance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filesByType.feature_importance.map((file, i) => (
                <ImageCard key={i} title="Feature Importance" file={file} />
              ))}
            </div>
          </div>
        )}

        {hasExplainability && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <Layers className="h-5 w-5 mr-2 text-primary" />
              SHAP Explainability
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filesByType.explainability.map((file, i) => (
                <ImageCard key={i} title="SHAP Values" file={file} />
              ))}
            </div>
          </div>
        )}

        {(hasEvaluation || hasConfusionMatrix) && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary" />
              Evaluation Curves
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filesByType.evaluation.map((file, i) => {
                const title = file.file_type.includes('roc') 
                  ? 'ROC Curve'
                  : file.file_type.includes('precision') 
                  ? 'Precision-Recall Curve'
                  : 'Evaluation Curve';
                return <ImageCard key={i} title={title} file={file} />;
              })}
              {filesByType.confusion_matrix.map((file, i) => (
                <ImageCard key={i} title="Confusion Matrix" file={file} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper component for visualization images
  const ImageCard = ({ title, file }: { title: string, file: {file_url: string, file_type: string, created_at: string} }) => {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="p-4 pb-2 bg-muted/30">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Dialog>
            <DialogTrigger asChild>
              <div className="cursor-pointer hover:opacity-90 transition-opacity">
                <img 
                  src={file.file_url} 
                  alt={title}
                  className="w-full h-auto rounded-md border border-border"
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <div className="p-1">
                <h3 className="font-medium mb-2">{title}</h3>
                <img 
                  src={file.file_url} 
                  alt={title}
                  className="w-full h-auto rounded-md"
                />
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download Image
                    </a>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <div className="mt-2 flex justify-end">
            <Button variant="outline" size="sm" asChild>
              <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-1" />
                Download
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Function to render downloads section
  const renderDownloads = () => {
    const modelFiles = filesByType.model;
    const predictionFiles = filesByType.predictions;
    
    if (modelFiles.length === 0 && predictionFiles.length === 0) {
      return (
        <Card className="bg-muted/30">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-muted-foreground">No downloadable files available for this experiment</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modelFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Layers className="h-5 w-5 mr-2 text-primary" />
                Trained Model
              </CardTitle>
              <CardDescription>
                Download the trained H2O model file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <a href={modelFiles[0].file_url} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download Model
                </a>
              </Button>
              {modelFiles[0].created_at && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Created {formatDistanceToNow(new Date(modelFiles[0].created_at), { addSuffix: true })}
                </p>
              )}
            </CardContent>
          </Card>
        )}
        
        {predictionFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Predictions
              </CardTitle>
              <CardDescription>
                Download model predictions on test data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <a href={predictionFiles[0].file_url} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download Predictions
                </a>
              </Button>
              {predictionFiles[0].created_at && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Created {formatDistanceToNow(new Date(predictionFiles[0].created_at), { addSuffix: true })}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200">
          H2O AutoML
        </Badge>
        {completed_at && (
          <span className="text-sm text-muted-foreground">
            Completed {formatDistanceToNow(new Date(completed_at), { addSuffix: true })}
          </span>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics" className="text-sm">
            <Activity className="h-4 w-4 mr-2" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="visualizations" className="text-sm">
            <BarChart4 className="h-4 w-4 mr-2" />
            Visualizations
          </TabsTrigger>
          <TabsTrigger value="downloads" className="text-sm">
            <Download className="h-4 w-4 mr-2" />
            Downloads
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="metrics" className="space-y-6">
          {renderMetrics()}
          <div className="mt-8">{renderLeaderboard()}</div>
        </TabsContent>
        
        <TabsContent value="visualizations" className="space-y-6">
          {renderVisualizations()}
        </TabsContent>
        
        <TabsContent value="downloads" className="space-y-6">
          {renderDownloads()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default H2OExperimentResults;
