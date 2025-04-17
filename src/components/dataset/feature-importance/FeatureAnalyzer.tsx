
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { BarChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeatureAnalyzerProps {
  selectedFeatures: string[];
}

const FeatureAnalyzer: React.FC<FeatureAnalyzerProps> = ({
  selectedFeatures
}) => {
  const { datasetId, targetColumn, setFeatureImportance, setTaskType } = useDataset();
  const { toast } = useToast();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [taskTypeError, setTaskTypeError] = useState<string | null>(null);
  
  const handleAnalyzeFeatures = async () => {
    if (!datasetId || !targetColumn || selectedFeatures.length === 0) {
      toast({
        title: "Cannot analyze features",
        description: "Please select a target column and at least one feature to analyze",
        variant: "destructive"
      });
      return;
    }
    
    setIsAnalyzing(true);
    setTaskTypeError(null);
    
    try {
      // First, detect the task type
      const taskTypeResponse = await datasetApi.detectTaskType(datasetId, targetColumn);
      
      if (!taskTypeResponse.task_type) {
        throw new Error("Could not determine task type");
      }
      
      // Update the task type in the context
      setTaskType(taskTypeResponse.task_type);
      
      // Then get feature importance
      const featureImportanceResponse = await datasetApi.featureImportancePreview(datasetId, targetColumn);
      
      // Update feature importance in context
      if (featureImportanceResponse?.data?.feature_importance) {
        setFeatureImportance(featureImportanceResponse.data.feature_importance);
      } else {
        throw new Error("No feature importance data received");
      }
      
      toast({
        title: "Success",
        description: "Feature importance calculated successfully",
      });
    } catch (error) {
      console.error('Error analyzing features:', error);
      setTaskTypeError(error instanceof Error ? error.message : 'Failed to analyze features');
      toast({
        title: "Error analyzing features",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <div className="mb-6">
      <div className="flex justify-center">
        <Button 
          onClick={handleAnalyzeFeatures}
          disabled={isAnalyzing || !targetColumn || selectedFeatures.length === 0}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          <BarChart className="mr-2 h-5 w-5" />
          {isAnalyzing ? "Analyzing..." : "Analyze Feature Importance"}
        </Button>
      </div>
      
      {taskTypeError && (
        <div className="mt-2 text-center text-red-500 text-sm">
          {taskTypeError}
        </div>
      )}
      
      <div className="mt-4 text-center text-sm text-gray-500">
        This will calculate the importance of each selected feature in predicting the target variable
      </div>
    </div>
  );
};

export default FeatureAnalyzer;
