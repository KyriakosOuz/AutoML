
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DatasetPageContent from '@/components/dataset/DatasetPageContent';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const DatasetPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const datasetId = searchParams.get('id');
  const { updateState } = useDataset();
  const { toast } = useToast();

  // If a dataset ID is provided in the URL, load that dataset
  useEffect(() => {
    const loadDataset = async () => {
      if (!datasetId) return;

      try {
        // Fetch dataset preview
        const previewResponse = await datasetApi.previewDataset(datasetId, 'raw');
        
        if (previewResponse) {
          // Get numerical and categorical features from the overview
          const overview = previewResponse.overview || {};
          const numericalFeatures = overview.numerical_features || [];
          const categoricalFeatures = overview.categorical_features || [];
          
          // Create a properly structured overview object
          const datasetOverview = {
            num_rows: overview.num_rows || 0,
            num_columns: overview.num_columns || 0,
            missing_values: overview.missing_values || {}, 
            numerical_features: numericalFeatures,
            categorical_features: categoricalFeatures,
            total_missing_values: overview.total_missing_values || 0,
            missing_values_count: overview.missing_values_count || {},
            column_names: overview.column_names || [],
            unique_values_count: overview.unique_values_count || {},
            data_types: overview.data_types || {},
            feature_classification: overview.feature_classification || {}
          };
          
          // Update the dataset context with the loaded dataset
          updateState({
            datasetId: datasetId,
            fileUrl: previewResponse.file_url,
            overview: datasetOverview,
            previewColumns: [...numericalFeatures, ...categoricalFeatures],
            processingStage: 'raw',
          });
          
          toast({
            title: "Dataset Loaded",
            description: "Your dataset has been loaded successfully",
          });
        }
      } catch (error) {
        console.error('Error loading dataset:', error);
        toast({
          title: "Failed to load dataset",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive"
        });
      }
    };
    
    loadDataset();
  }, [datasetId, updateState, toast]);

  return <DatasetPageContent />;
};

export default DatasetPage;
