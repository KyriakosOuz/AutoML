
import React, { useState } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const SaveDatasetButton: React.FC = () => {
  const { 
    datasetId, 
    targetColumn, 
    columnsToKeep,
    updateState
  } = useDataset();
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveDataset = async () => {
    if (!datasetId || !targetColumn || !columnsToKeep || !columnsToKeep.length) {
      toast({
        title: "Error",
        description: "Dataset ID, target column, and features are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Save the selected features
      const response = await datasetApi.saveDataset(
        datasetId, 
        targetColumn,
        columnsToKeep
      );
      
      // Update context with response data
      updateState({
        datasetId: response.dataset_id,
        fileUrl: response.file_url,
        columnsToKeep: response.columns_to_keep,
        targetColumn: response.target_column,
        overview: response.overview,
        processingStage: 'final'
      });
      
      toast({
        title: "Features saved",
        description: "Selected features have been saved successfully.",
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Error saving dataset:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save dataset',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={saveDataset} 
      disabled={isLoading || !targetColumn}
      variant="default"
      size="lg"
      className="bg-purple-600 hover:bg-purple-700"
    >
      <Save className="h-4 w-4 mr-2" />
      {isLoading ? 'Saving...' : 'Save & Continue'}
    </Button>
  );
};

export default SaveDatasetButton;
