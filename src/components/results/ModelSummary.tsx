
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExperimentResults } from '@/types/training';
import { Clock, Layers, Activity } from 'lucide-react';

interface ModelSummaryProps {
  results: ExperimentResults;
}

const ModelSummary: React.FC<ModelSummaryProps> = ({ results }) => {
  const {
    experiment_name,
    task_type,
    algorithm,
    automl_engine,
    target_column,
    training_time_sec,
    created_at,
    completed_at,
    selected_algorithm,
    algorithm_choice,
    training_type
  } = results;

  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };
  
  // Extract algorithm information from various sources in the result
  const displayAlgorithm = selected_algorithm || algorithm_choice || algorithm || automl_engine || 'N/A';
  
  // Display engine type
  const engineType = automl_engine ? 'AutoML' : training_type === 'custom' ? 'Custom' : 'N/A';

  // Format task type
  const formatTaskType = (type: string = '') => {
    if (!type) return "Unknown";
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Model Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Algorithm:</span>
                  <span className="font-medium text-right">{displayAlgorithm}</span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Engine Type:</span>
                  <Badge variant="outline" className="bg-primary/10">
                    {engineType}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Task:</span>
                  <span className="font-medium text-right">{formatTaskType(task_type)}</span>
                </div>
                
                {target_column && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Target Column:</span>
                    <span className="font-medium text-right">{target_column}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Training Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium text-right">{formatDate(created_at)}</span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="font-medium text-right">{formatDate(completed_at)}</span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Training Time:</span>
                  <span className="font-medium text-right">
                    {training_time_sec ? `${training_time_sec.toFixed(1)}s` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-wrap gap-2">
        <div className="inline-flex items-center text-sm bg-muted px-3 py-1 rounded-full">
          <Clock className="h-3.5 w-3.5 mr-1" />
          {formatDate(completed_at)}
        </div>
        
        <div className="inline-flex items-center text-sm bg-muted px-3 py-1 rounded-full">
          <Layers className="h-3.5 w-3.5 mr-1" />
          {formatTaskType(task_type)}
        </div>
        
        {target_column && (
          <div className="inline-flex items-center text-sm bg-muted px-3 py-1 rounded-full">
            <Activity className="h-3.5 w-3.5 mr-1" />
            {target_column}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelSummary;
