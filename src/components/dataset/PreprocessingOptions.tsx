
import React, { useState, useEffect } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

import PreprocessingCard from './preprocessing/PreprocessingCard';
import DatasetFeatureExtractor from './preprocessing/DatasetFeatureExtractor';

const PreprocessingOptions: React.FC = () => {
  const { datasetId } = useDataset();
  
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  // Fetch preview data to get accurate column information
  useEffect(() => {
    const fetchPreviewData = async () => {
      if (!datasetId) return;
      
      try {
        setIsLoadingPreview(true);
        const response = await datasetApi.previewDataset(datasetId, 'final');
        console.log('Preview API response:', response);
        
        // Handle both direct response and nested data
        const data = response.data || response;
        setPreviewData(data);
      } catch (error) {
        console.error('Error fetching preview data:', error);
      } finally {
        setIsLoadingPreview(false);
      }
    };
    
    fetchPreviewData();
  }, [datasetId]);

  const { columnsToKeep } = useDataset();

  if (!datasetId || !columnsToKeep || columnsToKeep.length === 0) {
    return (
      <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200 mt-6">
        <InfoIcon className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Please select a dataset and save your feature selection before preprocessing.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <DatasetFeatureExtractor 
      previewData={previewData} 
      columnsToKeep={columnsToKeep}
    >
      {(featureTypes, hasNumericalToNormalize) => (
        <PreprocessingCard
          featureTypes={featureTypes}
          hasNumericalToNormalize={hasNumericalToNormalize}
          isLoadingPreview={isLoadingPreview}
        />
      )}
    </DatasetFeatureExtractor>
  );
};

export default PreprocessingOptions;
