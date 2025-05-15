
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
      toast({
        title: "Missing Required Fields",
        description: "Dataset ID, target column, and features are required",
        variant: "destructive"
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
      
      // Only update what is returned by the API, keep the existing state for other properties
      if (response) {
        // Notify success
        toast({
          title: "Success",
          description: "Features saved successfully",
          variant: "default"
        });
        
        // Call the callback function after successful save
        onSaveComplete();
      }
      
    } catch (error) {
      console.error('Error saving dataset:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save dataset',
        variant: "destructive"
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
