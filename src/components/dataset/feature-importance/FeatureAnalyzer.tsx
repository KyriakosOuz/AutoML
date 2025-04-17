
import React, { useState } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface FeatureAnalyzerProps {
  selectedFeatures: string[];
}

const FeatureAnalyzer: React.FC<FeatureAnalyzerProps> = ({ selectedFeatures }) => {
  const { 
    datasetId, 
    targetColumn,
    taskType,
    setFeatureImportance,
    updateState
  } = useDataset();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingFeatures, setIsAnalyzingFeatures] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const analyzeFeatures = async () => {
    if (!datasetId || !targetColumn) {
      setError('Dataset ID and target column are required');
      return;
    }
    
    if (selectedFeatures.length === 0) {
      setError('Please select at least one feature to analyze');
      return;
    }

    try {
      setIsLoading(true);
      setIsAnalyzingFeatures(true);
      setError(null);
      
      console.log('Analyzing features for dataset:', datasetId);
      console.log('Target column:', targetColumn);
      console.log('Selected features:', selectedFeatures);
      
      // Call the API with the selected features and target column
      const response = await datasetApi.featureImportancePreview(
        datasetId, 
        targetColumn
      );
      
      console.log('Feature importance response:', response);
      
      // Extract feature importance data from response
      const importanceData = response.feature_importance || [];
      
      if (!importanceData || importanceData.length === 0) {
        throw new Error('No feature importance data returned from API');
      }
      
      // Filter feature importance data to show only selected features
      const filteredImportance = importanceData.filter(
        (item: any) => selectedFeatures.includes(item.feature)
      );
      
      // Sort by importance in descending order
      const sortedImportance = [...filteredImportance].sort(
        (a: any, b: any) => b.importance - a.importance
      );
      
      // Limit to top 10 features for better visualization
      const topImportance = sortedImportance.slice(0, 10);
      
      console.log('Processed importance data:', topImportance);
      
      // Update context with the sorted and filtered data
      updateState({
        featureImportance: topImportance,
        taskType: response.task_type || taskType,
        columnsToKeep: selectedFeatures // Save the selected features
      });
      
      toast({
        title: "Feature importance analyzed",
        description: "Feature importance analysis completed successfully",
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Error analyzing features:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze features');
    } finally {
      setIsLoading(false);
      setIsAnalyzingFeatures(false);
    }
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="mt-4 flex justify-center">
        <Button 
          onClick={analyzeFeatures} 
          disabled={isLoading || !targetColumn || selectedFeatures.length === 0 || isAnalyzingFeatures}
          variant="default"
          size="lg"
          className="bg-purple-600 hover:bg-purple-700"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          {isAnalyzingFeatures ? 'Analyzing...' : 'Analyze Feature Importance'}
        </Button>
      </div>
      
      {isLoading && isAnalyzingFeatures && (
        <div className="space-y-4 mt-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-[350px] w-full rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default FeatureAnalyzer;
