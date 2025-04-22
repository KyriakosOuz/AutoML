
import React, { useState } from 'react';
import { useTraining } from '@/contexts/training/TrainingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Award, BarChart4, Clock, TrendingUp } from 'lucide-react';

export interface TrainingResultsProps {
  type?: 'automl' | 'custom';
  experimentId?: string;
  onReset?: () => void;
}

const TrainingResults: React.FC<TrainingResultsProps> = ({ 
  type = 'automl',
  experimentId,
  onReset
}) => {
  const { automlResult, customResult } = useTraining();
  const [activeTab, setActiveTab] = useState<string>('metrics');
  
  const result = type === 'automl' ? automlResult : customResult;
  
  if (!result) {
    return null;
  }
  
  // Add safeguards against undefined values
  const { metrics = {}, taskType = '', trainingTimeSec = 0, completedAt = '' } = result;
  const isClassification = taskType?.includes('classification');
  
  // Format a metric value for display
  const formatMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return (value * 100).toFixed(2) + '%';
  };
  
  // For regression metrics that shouldn't be formatted as percentages
  const formatRegressionMetric = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return value.toFixed(4);
  };
  
  const getMetricColor = (value: number | undefined) => {
    if (value === undefined) return 'text-gray-400';
    if (value >= 0.9) return 'text-green-600';
    if (value >= 0.7) return 'text-emerald-600';
    if (value >= 0.5) return 'text-amber-600';
    return 'text-red-600';
  };
  
  // Format training time safely
  const formattedTrainingTime = trainingTimeSec !== undefined 
    ? trainingTimeSec.toFixed(1) 
    : 'N/A';
  
  return (
    <Card className="w-full mt-6 rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-primary">
          <Award className="h-5 w-5" />
          Training Results
        </CardTitle>
        <CardDescription>
          {type === 'automl' 
            ? `AutoML training with ${(automlResult?.engine || '').toUpperCase()} completed in ${formattedTrainingTime} seconds` 
            : `Custom ${customResult?.selectedAlgorithm || ''} model trained in ${formattedTrainingTime} seconds`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
            <TabsTrigger value="visualization">Visualizations</TabsTrigger>
            {type === 'automl' && <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>}
            {type !== 'automl' && <TabsTrigger value="details">Model Details</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="metrics" className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isClassification ? (
                // Classification metrics
                <>
                  {metrics.accuracy !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Accuracy</span>
                        <span className={`text-sm font-bold ${getMetricColor(metrics.accuracy)}`}>
                          {formatMetric(metrics.accuracy)}
                        </span>
                      </div>
                      <Progress value={metrics.accuracy !== undefined ? metrics.accuracy * 100 : 0} className="h-2" />
                    </div>
                  )}
                  
                  {metrics.f1_score !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">F1 Score</span>
                        <span className={`text-sm font-bold ${getMetricColor(metrics.f1_score)}`}>
                          {formatMetric(metrics.f1_score)}
                        </span>
                      </div>
                      <Progress value={metrics.f1_score !== undefined ? metrics.f1_score * 100 : 0} className="h-2" />
                    </div>
                  )}
                  
                  {metrics.precision !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Precision</span>
                        <span className={`text-sm font-bold ${getMetricColor(metrics.precision)}`}>
                          {formatMetric(metrics.precision)}
                        </span>
                      </div>
                      <Progress value={metrics.precision !== undefined ? metrics.precision * 100 : 0} className="h-2" />
                    </div>
                  )}
                  
                  {metrics.recall !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Recall</span>
                        <span className={`text-sm font-bold ${getMetricColor(metrics.recall)}`}>
                          {formatMetric(metrics.recall)}
                        </span>
                      </div>
                      <Progress value={metrics.recall !== undefined ? metrics.recall * 100 : 0} className="h-2" />
                    </div>
                  )}
                </>
              ) : (
                // Regression metrics
                <>
                  {metrics.r2_score !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">R² Score</span>
                        <span className={`text-sm font-bold ${getMetricColor(metrics.r2_score)}`}>
                          {formatRegressionMetric(metrics.r2_score)}
                        </span>
                      </div>
                      <Progress value={metrics.r2_score !== undefined ? Math.max(0, metrics.r2_score * 100) : 0} className="h-2" />
                    </div>
                  )}
                  
                  {metrics.mae !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Mean Absolute Error</span>
                        <span className="text-sm font-bold text-gray-800">
                          {formatRegressionMetric(metrics.mae)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {metrics.mse !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Mean Squared Error</span>
                        <span className="text-sm font-bold text-gray-800">
                          {formatRegressionMetric(metrics.mse)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {metrics.rmse !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Root Mean Squared Error</span>
                        <span className="text-sm font-bold text-gray-800">
                          {formatRegressionMetric(metrics.rmse)}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="mt-6 flex flex-col space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Training Time:
                </span>
                <span className="font-medium">{formattedTrainingTime} seconds</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Completed At:</span>
                <span className="font-medium">
                  {completedAt ? new Date(completedAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="visualization" className="pt-4">
            <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <BarChart4 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Model visualizations will be displayed here when available.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Includes confusion matrix, ROC curves, or SHAP plots depending on the model type.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="leaderboard" className="pt-4">
            {type === 'automl' && automlResult?.leaderboard ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-4 py-2 text-left">Model</th>
                      <th className="px-4 py-2 text-right">Performance</th>
                      <th className="px-4 py-2 text-right">Training Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {automlResult.leaderboard.map((model, index) => (
                      <tr 
                        key={index}
                        className={index === 0 ? "bg-primary/10 font-medium" : "border-t"}
                      >
                        <td className="px-4 py-2">
                          {index === 0 && <Award className="h-4 w-4 inline mr-1 text-primary" />}
                          {model.model}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {isClassification 
                            ? formatMetric(model.metric_value)
                            : formatRegressionMetric(model.metric_value)
                          }
                        </td>
                        <td className="px-4 py-2 text-right">
                          {model.training_time !== undefined ? model.training_time.toFixed(1) : 'N/A'}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No leaderboard information available
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="details" className="pt-4">
            {type === 'custom' && customResult && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Model Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Algorithm:</div>
                    <div className="font-medium">{customResult.selectedAlgorithm || 'N/A'}</div>
                    
                    <div>Task Type:</div>
                    <div className="font-medium">{customResult.taskType ? customResult.taskType.replace('_', ' ') : 'N/A'}</div>
                    
                    <div>Model Format:</div>
                    <div className="font-medium">{customResult.modelFormat || 'pkl'}</div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Model
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TrainingResults;
