
import React, { useState } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface FeatureAnalyzerProps {
  selectedFeatures: string[];
}

const FeatureAnalyzer: React.FC<FeatureAnalyzerProps> = ({ selectedFeatures }) => {
  const { 
    datasetId, 
    targetColumn,
    taskType,
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
      
      // Check if we have a valid response first
      if (!response || !response.data) {
        throw new Error('Invalid response from API');
      }
      
      // Extract feature importance data from response - properly navigate to data.feature_importance
      const importanceData = response.data.feature_importance || [];
      
      if (!importanceData || importanceData.length === 0) {
        throw new Error('No feature importance data returned from API');
      }
      
      // Filter feature importance data to show only selected features
      const filteredImportance = importanceData.filter(
        (item: any) => selectedFeatures.includes(item.feature)
      );
      
      // If we still have no data after filtering
      if (filteredImportance.length === 0) {
        throw new Error('No feature importance data available for selected features');
      }
      
      // Sort by importance in descending order
      const sortedImportance = [...filteredImportance].sort(
        (a: any, b: any) => b.importance - a.importance
      );
      
      console.log('Processed importance data:', sortedImportance);
      
      // Determine task type if it's not already set
      // The API may return either task_type directly or as part of a nested object
      let detectedTaskType = taskType;
      
      if (response.data.task_type) {
        detectedTaskType = response.data.task_type;
      } else if (typeof response.data === 'string' && 
                (response.data.includes('classification') || response.data.includes('regression'))) {
        detectedTaskType = response.data.trim();
      }
      
      // Update context with the sorted and filtered data
      updateState({
        featureImportance: sortedImportance,
        taskType: detectedTaskType || taskType,
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
    <Card className="mt-6">
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-center">
          <Button 
            onClick={analyzeFeatures} 
            disabled={isLoading || !targetColumn || selectedFeatures.length === 0 || isAnalyzingFeatures}
            variant="default"
            size="lg"
            className="bg-black hover:bg-gray-800"
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
      </CardContent>
    </Card>
  );
};

export default FeatureAnalyzer;
