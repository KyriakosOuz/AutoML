import React, { useState } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, AlertCircle } from 'lucide-react';

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
      
      const response = await datasetApi.featureImportancePreview(
        datasetId, 
        targetColumn
      );
      
      console.log('Feature importance response:', response);
      
      if (!response || !response.data) {
        throw new Error('Invalid response from API');
      }
      
      const importanceData = response.data.feature_importance || [];
      
      if (!importanceData || importanceData.length === 0) {
        throw new Error('No feature importance data returned from API');
      }
      
      const filteredImportance = importanceData.filter(
        (item: any) => selectedFeatures.includes(item.feature)
      );
      
      if (filteredImportance.length === 0) {
        throw new Error('No feature importance data available for selected features');
      }
      
      const sortedImportance = [...filteredImportance].sort(
        (a: any, b: any) => b.importance - a.importance
      );
      
      console.log('Processed importance data:', sortedImportance);
      
      let detectedTaskType = taskType;
      
      if (response.data.task_type) {
        detectedTaskType = response.data.task_type;
      } else if (typeof response.data === 'string' && 
                (response.data.includes('classification') || response.data.includes('regression'))) {
        detectedTaskType = response.data.trim();
      }
      
      updateState({
        featureImportance: sortedImportance,
        taskType: detectedTaskType || taskType,
        columnsToKeep: selectedFeatures
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
