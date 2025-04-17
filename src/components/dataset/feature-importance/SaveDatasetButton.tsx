
import React, { useState } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save, ArrowRight } from 'lucide-react';

interface SaveDatasetButtonProps {
  selectedFeatures: string[];
  onSaveComplete: () => void;
}

const SaveDatasetButton: React.FC<SaveDatasetButtonProps> = ({ 
  selectedFeatures,
  onSaveComplete
}) => {
  const { 
    datasetId, 
    targetColumn, 
    updateState
  } = useDataset();
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveDataset = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent default action to stop any form submissions or other events
    e.preventDefault();
    
    if (!datasetId || !targetColumn || !selectedFeatures.length) {
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
        selectedFeatures
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
      
      // Call the callback function after successful save
      onSaveComplete();
      
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
      disabled={isLoading || !targetColumn || selectedFeatures.length === 0}
      variant="default"
      size="lg"
      className="bg-black hover:bg-gray-800 text-white"
    >
      {isLoading ? (
        <>Saving...</>
      ) : (
        <>
          <Save className="h-4 w-4 mr-2" />
          Save
        </>
      )}
    </Button>
  );
};

export default SaveDatasetButton;
