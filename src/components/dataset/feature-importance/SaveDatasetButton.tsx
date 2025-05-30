
import React, { useState } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

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
    targetColumn
  } = useDataset();
  
  const [isLoading, setIsLoading] = useState(false);

  const saveDataset = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent default action to stop any form submissions or other events
    e.preventDefault();
    
    if (!datasetId || !targetColumn || !selectedFeatures.length) {
      toast.error("Dataset ID, target column, and features are required");
      return;
    }

    try {
      setIsLoading(true);
      
      console.log("[SaveDatasetButton] Saving dataset with:", {
        datasetId,
        targetColumn,
        selectedFeatures
      });
      
      // Save the selected features
      const response = await datasetApi.saveDataset(
        datasetId, 
        targetColumn,
        selectedFeatures
      );
      
      // Only update what is returned by the API, keep the existing state for other properties
      if (response) {
        // Notify success
        toast.success("Features saved successfully");
        
        // Call the callback function after successful save
        onSaveComplete();
      }
      
    } catch (error) {
      console.error('Error saving dataset:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save dataset');
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
