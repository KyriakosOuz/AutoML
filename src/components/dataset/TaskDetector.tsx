
import React, { useState } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Brain } from 'lucide-react';

const TaskDetector: React.FC = () => {
  const { 
    datasetId, 
    targetColumn,
    taskType,
    setTaskType,
    setNumClasses,
    isLoading: contextLoading,
    setIsLoading: setContextLoading,
    error: contextError,
    setError: setContextError
  } = useDataset();
  
  const [detecting, setDetecting] = useState(false);

  const detectTaskType = async () => {
    if (!datasetId || !targetColumn) {
      setContextError('Dataset ID and target column are required');
      return;
    }

    try {
      setDetecting(true);
      setContextLoading(true);
      setContextError(null);
      
      const response = await datasetApi.detectTaskType(datasetId, targetColumn);
      
      setTaskType(response.task_type);
      setNumClasses(response.num_classes || null);
      
    } catch (error) {
      console.error('Error detecting task type:', error);
      setContextError(error instanceof Error ? error.message : 'Failed to detect task type');
    } finally {
      setDetecting(false);
      setContextLoading(false);
    }
  };

  if (!datasetId || !targetColumn) {
    return null;
  }

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Task Type Detection</CardTitle>
      </CardHeader>
      <CardContent>
        {contextError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{contextError}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 border rounded-md">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Selected target column:</span> {targetColumn}
            </p>
            
            {taskType && (
              <div className="mt-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Detected task type:</span>
                </p>
                <div className="mt-1">
                  <Badge 
                    variant="outline" 
                    className={`
                      px-3 py-1 text-sm
                      ${taskType === 'regression' ? 'bg-blue-50 text-blue-700 border-blue-300' : ''}
                      ${taskType === 'binary_classification' ? 'bg-green-50 text-green-700 border-green-300' : ''}
                      ${taskType === 'multiclass_classification' ? 'bg-purple-50 text-purple-700 border-purple-300' : ''}
                    `}
                  >
                    {taskType === 'regression' && 'Regression'}
                    {taskType === 'binary_classification' && 'Binary Classification'}
                    {taskType === 'multiclass_classification' && 'Multiclass Classification'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            onClick={detectTaskType} 
            disabled={detecting || contextLoading || !targetColumn}
            variant={taskType ? "outline" : "default"}
            className="w-full"
          >
            <Brain className="h-4 w-4 mr-2" />
            {detecting ? 'Detecting...' : taskType ? 'Detect Again' : 'Detect Task Type'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskDetector;
