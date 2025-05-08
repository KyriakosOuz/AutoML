
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExperimentResults } from '@/types/training';
import { Award, Calendar, Clock, Code, Database } from 'lucide-react';

interface ModelSummaryProps {
  results: ExperimentResults | null;
}

const ModelSummary: React.FC<ModelSummaryProps> = ({ results }) => {
  if (!results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Results Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No summary data is available for this experiment.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Extract key information
  const {
    algorithm,
    algorithm_choice,
    task_type,
    target_column,
    automl_engine,
    created_at,
    completed_at,
    training_time_sec,
    metrics,
    training_type
  } = results;

  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Format training time
  const formatTime = (seconds?: number) => {
    if (seconds === undefined) return 'N/A';
    
    if (seconds < 60) {
      return `${seconds.toFixed(1)} seconds`;
    } else if (seconds < 3600) {
      const minutes = seconds / 60;
      return `${minutes.toFixed(1)} minutes`;
    } else {
      const hours = seconds / 3600;
      return `${hours.toFixed(1)} hours`;
    }
  };

  // Get top metrics to display
  const getTopMetrics = () => {
    if (!metrics) return [];
    
    const priorityMetrics = ['accuracy', 'f1_score', 'precision', 'recall', 'r2', 'mse', 'rmse', 'mae'];
    const topMetrics = [];
    
    for (const key of priorityMetrics) {
      if (metrics[key] !== undefined) {
        const value = metrics[key];
        topMetrics.push({
          name: key.replace(/_/g, ' '),
          value: typeof value === 'number' 
            ? (value >= 0 && value <= 1 ? `${(value * 100).toFixed(2)}%` : value.toFixed(4))
            : String(value)
        });
        
        if (topMetrics.length >= 3) break;
      }
    }
    
    return topMetrics;
  };

  const displayedAlgorithm = algorithm || algorithm_choice || 'Not specified';
  const displayedTrainingType = training_type || (automl_engine ? 'automl' : 'custom');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Model Summary
          </CardTitle>
          <CardDescription>
            Key information about your trained model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Model Details</h3>
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="text-sm text-muted-foreground">Training Type:</div>
                  <div className="text-sm font-medium">
                    <Badge variant="outline">
                      {displayedTrainingType === 'automl' ? 'AutoML' : 'Custom'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">Algorithm:</div>
                  <div className="text-sm font-medium">
                    {displayedAlgorithm}
                  </div>
                  
                  {automl_engine && (
                    <>
                      <div className="text-sm text-muted-foreground">AutoML Engine:</div>
                      <div className="text-sm font-medium">{automl_engine}</div>
                    </>
                  )}
                  
                  <div className="text-sm text-muted-foreground">Task Type:</div>
                  <div className="text-sm font-medium capitalize">
                    {(task_type || 'Not specified').replace(/_/g, ' ')}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">Target Column:</div>
                  <div className="text-sm font-medium">{target_column || 'Not specified'}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Timing Information</h3>
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Started:
                  </div>
                  <div className="text-sm">{formatDate(created_at)}</div>
                  
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Completed:
                  </div>
                  <div className="text-sm">{formatDate(completed_at)}</div>
                  
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Training Time:
                  </div>
                  <div className="text-sm">{formatTime(training_time_sec)}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Top Metrics</h3>
              <div className="grid grid-cols-1 gap-3">
                {getTopMetrics().map((metric, index) => (
                  <Card key={index} className="bg-muted/50">
                    <CardContent className="p-3 flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">{metric.name}</span>
                      <span className="text-lg font-bold">{metric.value}</span>
                    </CardContent>
                  </Card>
                ))}
                {getTopMetrics().length === 0 && (
                  <p className="text-sm text-muted-foreground">No metrics available</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelSummary;
